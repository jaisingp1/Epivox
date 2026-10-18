import type { Server as SocketIOServer, Socket } from "socket.io";
import {
  getSessionByPin,
  addParticipant,
  getParticipants,
  updateSessionState,
  recordAnswer,
  getLiveResults,
  getQuestionAnswers,
  getLeaderboard,
  hasParticipantAnsweredQuestion,
} from "./sessionService.js";
import { getQuestionsByActivityId } from "./activityService.js";
import { calculateScore } from "./scoringService.js";
import { exec } from "../db/db.js";

interface ActiveSessionTimer {
  intervalId: NodeJS.Timeout | null;
  remainingSeconds: number;
}

const sessionTimers = new Map<string, ActiveSessionTimer>();
let ioInstance: SocketIOServer | null = null;

export function broadcastSessionCancelled(pin: string): void {
  stopServerTimer(pin);
  if (ioInstance) {
    ioInstance.to(`session:${pin}`).emit("session:state_changed", {
      status: "cancelled",
      currentStep: "cancelled",
      message:
        "La presentación ha sido cancelada o terminada por el presentador.",
    });
    ioInstance.to(`session:${pin}`).emit("session:cancelled", {
      message:
        "La presentación ha sido cancelada o terminada por el presentador.",
    });
  }
}

export function setupSocketManager(io: SocketIOServer): void {
  ioInstance = io;
  io.on("connection", (socket: Socket) => {
    console.log(`[Socket] Conectado: ${socket.id}`);

    // 1. Participante se une a la sesión
    socket.on(
      "participant:join",
      async (data: {
        pin: string;
        nickname: string;
        avatarSeed: string;
        department?: string;
      }) => {
        try {
          const { pin, nickname, avatarSeed, department } = data;
          const session = await getSessionByPin(pin);

          if (!session) {
            socket.emit("error:message", {
              message: "Sesión no encontrada o PIN inválido.",
            });
            return;
          }

          if (session.status === "finished") {
            socket.emit("error:message", {
              message: "Esta sesión ya ha finalizado.",
            });
            return;
          }

          const participant = await addParticipant(
            session.id,
            nickname,
            avatarSeed,
            department,
          );

          // Unir socket a la sala de la sesión
          const roomName = `session:${pin}`;
          socket.join(roomName);

          // Guardar metadata en socket
          socket.data.pin = pin;
          socket.data.participantId = participant.id;
          socket.data.sessionId = session.id;

          const questions = await getQuestionsByActivityId(session.activity_id);
          const currentQIndex = session.current_question_index ?? 0;
          const currentQuestion = questions[currentQIndex] || null;

          let hasAnswered = false;
          if (currentQuestion) {
            hasAnswered = await hasParticipantAnsweredQuestion(
              session.id,
              currentQuestion.id,
              participant.id,
            );
          }

          const timer = sessionTimers.get(pin);
          const remainingSeconds = timer
            ? timer.remainingSeconds
            : currentQuestion?.time_limit || 120;

          // Responder al participante con su perfil y estado activo si corresponde
          socket.emit("participant:joined", {
            participant,
            session: {
              id: session.id,
              pin: session.pin,
              status: session.status,
              currentQuestionIndex: session.current_question_index,
              currentStep: session.current_step,
            },
            currentQuestion:
              session.status === "question_active" ? currentQuestion : null,
            remainingSeconds,
            hasAnswered,
          });

          // Notificar a toda la sala (incluida la pantalla principal) la lista actualizada de participantes
          const allParticipants = await getParticipants(session.id);
          io.to(`session:${pin}`).emit("lobby:participants_update", {
            count: allParticipants.length,
            participants: allParticipants,
          });

          console.log(
            `[Socket] Participante ${nickname} (#${participant.id}) se unió a sesión ${pin} (estado: ${session.status})`,
          );
        } catch (err) {
          console.error("[Socket participant:join Error]:", err);
          socket.emit("error:message", {
            message: "Ocurrió un error al unirse a la sesión.",
          });
        }
      },
    );

    // 1b. Sincronización de estado para participantes (al cargar o refrescar /live/:pin)
    socket.on(
      "participant:sync",
      async (data: { pin: string; participantId?: number }) => {
        try {
          const { pin, participantId } = data;
          const session = await getSessionByPin(pin);
          if (!session) {
            socket.emit("error:message", {
              message: "Sesión no encontrada o PIN inválido.",
            });
            return;
          }

          socket.join(`session:${pin}`);
          if (participantId) {
            socket.data.pin = pin;
            socket.data.participantId = participantId;
            socket.data.sessionId = session.id;
          }

          const questions = await getQuestionsByActivityId(session.activity_id);
          const currentQIndex = session.current_question_index ?? 0;
          const currentQuestion = questions[currentQIndex] || null;

          let hasAnswered = false;
          if (participantId && currentQuestion) {
            hasAnswered = await hasParticipantAnsweredQuestion(
              session.id,
              currentQuestion.id,
              participantId,
            );
          }

          const timer = sessionTimers.get(pin);
          const remainingSeconds = timer
            ? timer.remainingSeconds
            : currentQuestion?.time_limit || 120;

          socket.emit("participant:sync_state", {
            status: session.status,
            currentStep: session.current_step,
            currentQuestionIndex: currentQIndex,
            question:
              session.status === "question_active" ||
              session.status === "question_closed"
                ? currentQuestion
                : null,
            remainingSeconds,
            hasAnswered,
          });
        } catch (err) {
          console.error("[Socket participant:sync Error]:", err);
        }
      },
    );

    // 2. Pantalla Principal / Presentador se conecta a la sesión
    socket.on("presenter:join", async (data: { pin: string }) => {
      try {
        const { pin } = data;
        const session = await getSessionByPin(pin);

        if (!session) {
          socket.emit("error:message", { message: "Sesión no encontrada." });
          return;
        }

        socket.join(`session:${pin}`);
        socket.join(`presenter:${pin}`);

        const participants = await getParticipants(session.id);
        const questions = await getQuestionsByActivityId(session.activity_id);
        const currentQIndex = session.current_question_index ?? 0;
        const currentQuestion = questions[currentQIndex];

        let liveResults: Record<string, number> = {};
        let rawAnswers: any[] = [];
        let totalAnswers = 0;
        if (currentQuestion) {
          liveResults = await getLiveResults(session.id, currentQuestion.id);
          rawAnswers = await getQuestionAnswers(session.id, currentQuestion.id);
          totalAnswers = Object.values(liveResults).reduce((a, b) => a + b, 0);
        }

        socket.emit("presenter:sync", {
          session,
          participants,
          questions,
          liveResults,
          rawAnswers,
          totalAnswers,
        });

        console.log(`[Socket] Presentador sincronizado en sesión ${pin}`);
      } catch (err) {
        console.error("[Socket presenter:join Error]:", err);
      }
    });

    // 3. Control del Presentador: Avanzar fase / estado / preguntas
    socket.on(
      "presenter:action",
      async (data: { pin: string; action: string; questionIndex?: number }) => {
        try {
          const { pin, action, questionIndex } = data;
          const session = await getSessionByPin(pin);
          if (!session) return;

          const questions = await getQuestionsByActivityId(session.activity_id);
          const currentQIndex =
            questionIndex !== undefined
              ? questionIndex
              : (session.current_question_index ?? 0);
          const currentQuestion = questions[currentQIndex] || questions[0];

          if (action === "start_game" || action === "jump_to_question") {
            const targetIdx = questionIndex !== undefined ? questionIndex : 0;
            const targetQuestion = questions[targetIdx] || questions[0];
            await updateSessionState(
              session.id,
              "question_active",
              targetIdx,
              "question",
            );
            const liveResults = await getLiveResults(
              session.id,
              targetQuestion.id,
            );
            const rawAnswers = await getQuestionAnswers(
              session.id,
              targetQuestion.id,
            );
            const totalAnswers = Object.values(liveResults).reduce(
              (a, b) => a + b,
              0,
            );

            io.to(`session:${pin}`).emit("session:state_changed", {
              status: "question_active",
              currentQuestionIndex: targetIdx,
              currentStep: "question",
              question: targetQuestion,
              results: liveResults,
              rawAnswers,
              totalAnswers,
            });

            // Enviar actualización de resultados viva
            io.to(`session:${pin}`).emit("results:live_update", {
              totalAnswers,
              results: liveResults,
              answers: rawAnswers,
            });

            startServerTimer(io, pin, targetQuestion.time_limit);
          } else if (action === "show_results") {
            stopServerTimer(pin);
            await updateSessionState(
              session.id,
              "question_closed",
              currentQIndex,
              "results",
            );
            const results = await getLiveResults(
              session.id,
              currentQuestion.id,
            );
            const rawAnswers = await getQuestionAnswers(
              session.id,
              currentQuestion.id,
            );
            const totalAnswers = Object.values(results).reduce(
              (a, b) => a + b,
              0,
            );

            io.to(`session:${pin}`).emit("session:state_changed", {
              status: "question_closed",
              currentQuestionIndex: currentQIndex,
              currentStep: "results",
              question: currentQuestion,
              results,
              rawAnswers,
              totalAnswers,
              correctAnswer: currentQuestion.options_json,
            });
          } else if (action === "show_leaderboard") {
            await updateSessionState(
              session.id,
              "leaderboard",
              currentQIndex,
              "leaderboard",
            );
            const leaderboard = await getLeaderboard(session.id, 5);
            io.to(`session:${pin}`).emit("session:state_changed", {
              status: "leaderboard",
              currentQuestionIndex: currentQIndex,
              currentStep: "leaderboard",
              leaderboard,
            });
          } else if (
            action === "jump_to_question" &&
            questionIndex !== undefined
          ) {
            const targetIdx = Math.max(
              0,
              Math.min(questionIndex, questions.length - 1),
            );
            const targetQuestion = questions[targetIdx];
            await updateSessionState(
              session.id,
              "question_active",
              targetIdx,
              "question",
            );
            const liveResults = await getLiveResults(
              session.id,
              targetQuestion.id,
            );
            const rawAnswers = await getQuestionAnswers(
              session.id,
              targetQuestion.id,
            );
            const totalAnswers = Object.values(liveResults).reduce(
              (a, b) => a + b,
              0,
            );

            io.to(`session:${pin}`).emit("session:state_changed", {
              status: "question_active",
              currentQuestionIndex: targetIdx,
              currentStep: "question",
              question: targetQuestion,
              results: liveResults,
              rawAnswers,
              totalAnswers,
            });

            io.to(`session:${pin}`).emit("results:live_update", {
              totalAnswers,
              results: liveResults,
              answers: rawAnswers,
            });

            startServerTimer(io, pin, targetQuestion.time_limit);
          } else if (action === "prev_question") {
            const prevIndex = Math.max(0, currentQIndex - 1);
            const prevQuestion = questions[prevIndex];
            await updateSessionState(
              session.id,
              "question_active",
              prevIndex,
              "question",
            );
            const liveResults = await getLiveResults(
              session.id,
              prevQuestion.id,
            );
            const rawAnswers = await getQuestionAnswers(
              session.id,
              prevQuestion.id,
            );
            const totalAnswers = Object.values(liveResults).reduce(
              (a, b) => a + b,
              0,
            );

            io.to(`session:${pin}`).emit("session:state_changed", {
              status: "question_active",
              currentQuestionIndex: prevIndex,
              currentStep: "question",
              question: prevQuestion,
              results: liveResults,
              rawAnswers,
              totalAnswers,
            });

            io.to(`session:${pin}`).emit("results:live_update", {
              totalAnswers,
              results: liveResults,
              answers: rawAnswers,
            });

            startServerTimer(io, pin, prevQuestion.time_limit);
          } else if (action === "next_question") {
            const nextIndex = currentQIndex + 1;
            if (nextIndex < questions.length) {
              const nextQuestion = questions[nextIndex];
              await updateSessionState(
                session.id,
                "question_active",
                nextIndex,
                "question",
              );
              const liveResults = await getLiveResults(
                session.id,
                nextQuestion.id,
              );
              const rawAnswers = await getQuestionAnswers(
                session.id,
                nextQuestion.id,
              );
              const totalAnswers = Object.values(liveResults).reduce(
                (a, b) => a + b,
                0,
              );

              io.to(`session:${pin}`).emit("session:state_changed", {
                status: "question_active",
                currentQuestionIndex: nextIndex,
                currentStep: "question",
                question: nextQuestion,
                results: liveResults,
                rawAnswers,
                totalAnswers,
              });

              io.to(`session:${pin}`).emit("results:live_update", {
                totalAnswers,
                results: liveResults,
                answers: rawAnswers,
              });

              startServerTimer(io, pin, nextQuestion.time_limit);
            } else {
              // Fin del sondeo o juego
              const isOpenPoll =
                session.session_mode === "poll" ||
                currentQuestion.question_type === "word_cloud" ||
                currentQuestion.question_type === "open_ended";

              if (isOpenPoll) {
                // Sondeo abierto Mentimeter: NO HAY PODIO NI RANKING, SOLO RESUMEN FINAL
                await updateSessionState(
                  session.id,
                  "finished",
                  currentQIndex,
                  "summary",
                );
                io.to(`session:${pin}`).emit("session:state_changed", {
                  status: "finished",
                  currentStep: "summary",
                  isOpenPoll: true,
                });
              } else {
                // Quiz con puntos: Podio con trofeos
                await updateSessionState(
                  session.id,
                  "finished",
                  currentQIndex,
                  "podium",
                );
                const finalPodium = await getLeaderboard(session.id, 3);
                io.to(`session:${pin}`).emit("session:state_changed", {
                  status: "finished",
                  currentStep: "podium",
                  podium: finalPodium,
                });
              }
            }
          } else if (action === "finish_session") {
            const isOpenPoll =
              session.session_mode === "poll" ||
              currentQuestion?.question_type === "word_cloud" ||
              currentQuestion?.question_type === "open_ended";

            await updateSessionState(
              session.id,
              "finished",
              currentQIndex,
              isOpenPoll ? "summary" : "podium",
            );
            const finalPodium = isOpenPoll
              ? []
              : await getLeaderboard(session.id, 3);
            io.to(`session:${pin}`).emit("session:state_changed", {
              status: "finished",
              currentStep: isOpenPoll ? "summary" : "podium",
              isOpenPoll,
              podium: finalPodium,
            });
          } else if (action === "cancel_session") {
            broadcastSessionCancelled(pin);
            await updateSessionState(
              session.id,
              "cancelled",
              currentQIndex,
              "cancelled",
            );
            console.log(`[Socket] Sesión ${pin} CANCELADA por el presentador.`);
          }
        } catch (err) {
          console.error("[Socket presenter:action Error]:", err);
        }
      },
    );

    // 4. Envío de Respuesta del Participante
    socket.on(
      "participant:submit_answer",
      async (data: {
        pin: string;
        participantId: number;
        questionId: number;
        answerPayload: string;
        timeTakenMs: number;
      }) => {
        try {
          const { pin, participantId, questionId, answerPayload, timeTakenMs } =
            data;
          const session = await getSessionByPin(pin);
          if (!session || session.status !== "question_active") return;

          const questions = await getQuestionsByActivityId(session.activity_id);
          const question = questions.find((q) => q.id === questionId);
          if (!question) return;

          // Comprobar si es encuesta / pregunta abierta sin concurso (Mentimeter mode)
          const isSurveyOrOpen =
            question.points_base === 0 ||
            question.question_type === "word_cloud" ||
            question.question_type === "open_ended" ||
            question.question_type === "likert";

          // Comprobar acierto
          let isCorrect = false;
          try {
            const options = JSON.parse(question.options_json) as Array<{
              id: string;
              is_correct?: boolean;
              isCorrect?: boolean;
              text: string;
            }>;
            const cleanPayload = (answerPayload || "").toString().trim();

            const selected = options.find((opt) => {
              const optId = (opt.id || "").toString().trim().toLowerCase();
              const optText = (opt.text || "").toString().trim().toLowerCase();
              const target = cleanPayload.toLowerCase();

              return (
                optId === target ||
                optText === target ||
                (target === "opt_t" &&
                  (optId === "true" || optText.includes("verdadero"))) ||
                (target === "opt_f" &&
                  (optId === "false" || optText.includes("falso")))
              );
            });

            const isOptionMarkedCorrect = Boolean(
              selected?.is_correct ?? selected?.isCorrect,
            );

            const isCorrectValueMatch = Boolean(
              question.correct_answer_value &&
              (question.correct_answer_value.toString().trim().toLowerCase() ===
                cleanPayload.toLowerCase() ||
                (selected &&
                  question.correct_answer_value
                    .toString()
                    .trim()
                    .toLowerCase() ===
                    (selected.id || "").toString().trim().toLowerCase()) ||
                (question.correct_answer_value.toLowerCase() === "true" &&
                  (cleanPayload === "opt_t" ||
                    cleanPayload.toLowerCase() === "verdadero")) ||
                (question.correct_answer_value.toLowerCase() === "false" &&
                  (cleanPayload === "opt_f" ||
                    cleanPayload.toLowerCase() === "falso"))),
            );

            isCorrect = isOptionMarkedCorrect || isCorrectValueMatch;
          } catch {
            isCorrect = false;
          }

          if (isSurveyOrOpen) {
            isCorrect = true;
          }

          // Obtener estado actual del participante (para rachas)
          const participants = await getParticipants(session.id);
          const participant = participants.find((p) => p.id === participantId);
          const currentStreak = participant?.current_streak || 0;

          const scoreCalc = calculateScore({
            isCorrect,
            pointsBase: question.points_base,
            timeTakenMs,
            timeLimitSec: question.time_limit,
            currentStreak,
          });

          const finalPoints = isSurveyOrOpen ? 0 : scoreCalc.pointsAwarded;
          const finalStreak = isSurveyOrOpen
            ? currentStreak
            : scoreCalc.newStreak;

          await recordAnswer(
            session.id,
            questionId,
            participantId,
            answerPayload,
            isCorrect,
            timeTakenMs,
            finalPoints,
            finalStreak,
          );

          // Notificar al participante su feedback instantáneo
          socket.emit("answer:accepted", {
            isCorrect,
            isPoll: isSurveyOrOpen,
            pointsAwarded: finalPoints,
            newStreak: finalStreak,
            multiplier: scoreCalc.multiplier,
          });

          // Notificar en tiempo real a la pantalla del presentador sobre el nuevo voto
          const liveResults = await getLiveResults(session.id, questionId);
          const rawAnswers = await getQuestionAnswers(session.id, questionId);

          io.to(`session:${pin}`).emit("results:live_update", {
            totalAnswers: Object.values(liveResults).reduce((a, b) => a + b, 0),
            results: liveResults,
            answers: rawAnswers,
          });
        } catch (err) {
          console.error("[Socket submit_answer Error]:", err);
        }
      },
    );

    // 5. Cambio dinámico de tipo de gráfico en vivo (Mentimeter mode)
    socket.on(
      "presenter:set_chart_type",
      async (data: { pin: string; questionId: number; chartType: string }) => {
        try {
          const { pin, questionId, chartType } = data;
          try {
            await exec(
              `UPDATE epivox_questions SET chart_type = '${chartType.replace(/'/g, "''")}' WHERE id = ${Number(questionId)}`,
            );
          } catch {
            // Columna opcional en base de datos; la emisión en tiempo real no se interrumpe
          }

          io.to(`session:${pin}`).emit("chart_type:updated", {
            questionId,
            chartType,
          });
          console.log(
            `[Socket] Tipo de gráfico actualizado a ${chartType} para pregunta #${questionId} en sesión ${pin}`,
          );
        } catch (err) {
          console.error("[Socket presenter:set_chart_type Error]:", err);
        }
      },
    );

    // 6. Reacciones en vivo (emojis flotantes)
    socket.on(
      "participant:reaction",
      (data: { pin: string; emoji: string }) => {
        io.to(`session:${data.pin}`).emit("reaction:floating", {
          emoji: data.emoji,
        });
      },
    );
  });
}

function startServerTimer(
  io: SocketIOServer,
  pin: string,
  seconds: number,
): void {
  stopServerTimer(pin);

  let remaining = seconds;
  const intervalId = setInterval(() => {
    remaining -= 1;
    io.to(`session:${pin}`).emit("timer:tick", { remaining });

    if (remaining <= 0) {
      stopServerTimer(pin);
      io.to(`session:${pin}`).emit("timer:expired");
    }
  }, 1000);

  sessionTimers.set(pin, { intervalId, remainingSeconds: remaining });
}

function stopServerTimer(pin: string): void {
  const existing = sessionTimers.get(pin);
  if (existing?.intervalId) {
    clearInterval(existing.intervalId);
  }
  sessionTimers.delete(pin);
}
