import type { Server as SocketIOServer, Socket } from "socket.io";
import {
  getSessionByPin,
  addParticipant,
  getParticipants,
  updateSessionState,
  recordAnswer,
  getLiveResults,
  getLeaderboard,
} from "./sessionService.js";
import { getQuestionsByActivityId } from "./activityService.js";
import { calculateScore } from "./scoringService.js";

interface ActiveSessionTimer {
  intervalId: NodeJS.Timeout | null;
  remainingSeconds: number;
}

const sessionTimers = new Map<string, ActiveSessionTimer>();

export function setupSocketManager(io: SocketIOServer): void {
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

          // Responder al participante con su perfil
          socket.emit("participant:joined", {
            participant,
            session: {
              id: session.id,
              pin: session.pin,
              status: session.status,
              currentQuestionIndex: session.current_question_index,
              currentStep: session.current_step,
            },
          });

          // Notificar a toda la sala (incluida la pantalla principal) la lista actualizada de participantes
          const allParticipants = await getParticipants(session.id);
          io.to(`session:${pin}`).emit("lobby:participants_update", {
            count: allParticipants.length,
            participants: allParticipants,
          });

          console.log(
            `[Socket] Participante ${nickname} (#${participant.id}) se unió a sesión ${pin}`,
          );
        } catch (err) {
          console.error("[Socket participant:join Error]:", err);
          socket.emit("error:message", {
            message: "Ocurrió un error al unirse a la sesión.",
          });
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

        socket.emit("presenter:sync", {
          session,
          participants,
          questions,
        });

        console.log(`[Socket] Presentador sincronizado en sesión ${pin}`);
      } catch (err) {
        console.error("[Socket presenter:join Error]:", err);
      }
    });

    // 3. Control del Presentador: Avanzar fase / estado
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
              : session.current_question_index;
          const currentQuestion = questions[currentQIndex];

          if (action === "start_game") {
            await updateSessionState(
              session.id,
              "question_active",
              0,
              "question",
            );
            io.to(`session:${pin}`).emit("session:state_changed", {
              status: "question_active",
              currentQuestionIndex: 0,
              currentStep: "question",
              question: questions[0],
            });
            startServerTimer(io, pin, questions[0].time_limit);
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
            io.to(`session:${pin}`).emit("session:state_changed", {
              status: "question_closed",
              currentQuestionIndex: currentQIndex,
              currentStep: "results",
              results,
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
          } else if (action === "next_question") {
            const nextIndex = currentQIndex + 1;
            if (nextIndex < questions.length) {
              await updateSessionState(
                session.id,
                "question_active",
                nextIndex,
                "question",
              );
              io.to(`session:${pin}`).emit("session:state_changed", {
                status: "question_active",
                currentQuestionIndex: nextIndex,
                currentStep: "question",
                question: questions[nextIndex],
              });
              startServerTimer(io, pin, questions[nextIndex].time_limit);
            } else {
              // Fin del juego -> Podio
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

          // Comprobar acierto
          let isCorrect = false;
          try {
            const options = JSON.parse(question.options_json) as Array<{
              id: string;
              is_correct?: boolean;
              text: string;
            }>;
            const selected = options.find(
              (opt) => opt.id === answerPayload || opt.text === answerPayload,
            );
            isCorrect = selected?.is_correct || false;
          } catch {
            isCorrect = false;
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

          await recordAnswer(
            session.id,
            questionId,
            participantId,
            answerPayload,
            isCorrect,
            timeTakenMs,
            scoreCalc.pointsAwarded,
            scoreCalc.newStreak,
          );

          // Notificar al participante su feedback instantáneo
          socket.emit("answer:accepted", {
            isCorrect,
            pointsAwarded: scoreCalc.pointsAwarded,
            newStreak: scoreCalc.newStreak,
            multiplier: scoreCalc.multiplier,
          });

          // Notificar en tiempo real a la pantalla del presentador sobre el nuevo voto
          const liveResults = await getLiveResults(session.id, questionId);
          io.to(`session:${pin}`).emit("results:live_update", {
            totalAnswers: Object.values(liveResults).reduce((a, b) => a + b, 0),
            results: liveResults,
          });
        } catch (err) {
          console.error("[Socket submit_answer Error]:", err);
        }
      },
    );

    // 5. Reacciones en vivo (emojis flotantes)
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
