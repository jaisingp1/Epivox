-- ==============================================================================
-- EPIVOX MASTER SEEDS (init_master.sql)
-- Datos maestros obligatorios de producción (Usuarios base y Temas visuales)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Usuario Super Administrador Inicial
-- ------------------------------------------------------------------------------
INSERT INTO users (id, username, email, password_hash, full_name, role, is_active)
VALUES (
  1,
  'jaisingp',
  'jaisingp@hotmail.com',
  '$2b$10$mUJA4fCM8pDvFWnMR4fSpOFRJ7VQA6mHUzeZyREPwdfoawJ3c8lGG',
  'Jaising Pasten',
  'admin',
  true
);

-- ------------------------------------------------------------------------------
-- 2. Temas Corporativos Oficiales Epiroc
-- ------------------------------------------------------------------------------
INSERT INTO epivox_themes (id, name, primary_color, secondary_color, background_color, card_color, text_color, accent_color, font_family, is_default)
VALUES (
  1,
  'Epiroc Dark Classic',
  '#FFC72C', -- Epiroc Yellow
  '#001E32', -- Epiroc Dark Blue
  '#001E32',
  '#193750',
  '#FFFFFF',
  '#48A9C5', -- Epiroc Light Blue
  'Raleway, sans-serif',
  true
);

INSERT INTO epivox_themes (id, name, primary_color, secondary_color, background_color, card_color, text_color, accent_color, font_family, is_default)
VALUES (
  2,
  'Epiroc Light Mining',
  '#001E32',
  '#FFC72C',
  '#ECEBE4', -- Epiroc Light Grey
  '#FFFFFF',
  '#001E32',
  '#B7312C', -- Epiroc Red
  'Raleway, sans-serif',
  false
);
