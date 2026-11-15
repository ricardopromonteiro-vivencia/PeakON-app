-- ============================================================
-- DEMO URL DE EXERCÍCIOS - PeakON
-- Adiciona uma URL de demonstração (YouTube) a cada exercício.
-- Executa este script no Supabase SQL Editor.
-- ============================================================

-- 1. Adicionar coluna demo_url à tabela exercises
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS demo_url text;

-- Comentário: guarda uma URL de YouTube (ou outro vídeo público).
-- Exemplo: 'https://www.youtube.com/watch?v=XXXXXXXXXXX'
-- NULL = sem demonstração disponível.

-- 2. Atualizar o catálogo global com as URLs de demonstração
--    (corresponde ao seed_exercises.sql)

-- PEITO
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=rT7DgCr-3pg' WHERE name = 'Supino Plano com Barra';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=8iPEnn-ltC8' WHERE name = 'Supino Inclinado com Halteres';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=Iwe6AmxVf7o' WHERE name = 'Crucifixo na Máquina (Peck Deck)';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=taI4XduLpTk' WHERE name = 'Crossover em Polia Baixa';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=X7_MkB7PVHQ' WHERE name = 'Crossover em Polia Alta';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=IODxDxX7oi4' WHERE name = 'Flexões de Braços';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=4Y2ZsFaQ4P0' WHERE name = 'Supino Declinado com Máquina';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=xUm0BiZCWlQ' WHERE name = 'Press de Peito em Máquina';

-- COSTAS
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=CAwf7n6Luuc' WHERE name = 'Puxada Frontal (Lat Pulldown)';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=9efgcAjQe7E' WHERE name = 'Remada Curvada com Barra';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=GZbfZ033f74' WHERE name = 'Remada Sentada em Polia Baixa';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=eGo4IYlbE5g' WHERE name = 'Elevação em Barra Fixa (Pull-ups)';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=M89J0FzHMEg' WHERE name = 'Pulldown com Corda (Braços Esticados)';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=pYcpY20QaE8' WHERE name = 'Remada Unilateral com Halter (Serrote)';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=j3SKO6-lQoo' WHERE name = 'Remada Cavalinho (T-Bar)';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=ph3pddpKzzw' WHERE name = 'Lombar no Banco Romano';

-- PERNA
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=ultWZbUMPL8' WHERE name = 'Agachamento Livre com Barra';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=IZxyjW7MPJQ' WHERE name = 'Leg Press 45º';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=YyvSfVjQeL0' WHERE name = 'Cadeira Extensora';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=1Tq3QdYUuHs' WHERE name = 'Cadeira Flexora';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=vHDVMNHhLCE' WHERE name = 'Mesa Flexora';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=2C-uNgKwPLE' WHERE name = 'Agachamento Búlgaro com Halteres';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=SEdqd1n0cvg' WHERE name = 'Elevação Pélvica (Hip Thrust)';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=XHBMoMQelcI' WHERE name = 'Prensa de Gémeos no Leg Press';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=JbyjNymZOt0' WHERE name = 'Prensa de Gémeos Sentado';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=QOVaHwm-Q6U' WHERE name = 'Afundos Fixos (Lunges)';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=1uDiW5--rAE' WHERE name = 'Stiff (Peso Morto Romeno)';

-- OMBRO
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=qEwKCR5JCog' WHERE name = 'Desenvolvimento com Halteres';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=3VcKaXpzqRo' WHERE name = 'Elevação Lateral com Halteres';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=sOgc1PXNQ3w' WHERE name = 'Elevação Frontal com Polia';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=Wjgj1KUIVJE' WHERE name = 'Crucifixo Invertido na Máquina';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=2yjwXTZQDDI' WHERE name = 'Desenvolvimento Militar com Barra';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=jOgvGUbOwTo' WHERE name = 'Remada Alta com Barra (Upright Row)';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=PPDTkJDRnPM' WHERE name = 'Elevação Lateral na Polia';

-- BICÍPITE
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=kwG2ipFRgfo' WHERE name = 'Curl com Barra W';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=sAq_ocpRh_I' WHERE name = 'Curl Alternado com Halteres';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=TwD-YGVP4Bk' WHERE name = 'Curl Martelo com Halteres';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=J2gqMoFbz3o' WHERE name = 'Curl em Polia Baixa (Corda ou Barra)';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=MVMNk0HiTMo' WHERE name = 'Curl Concentrado no Banco Scott';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=Cp1cBT0iq1U' WHERE name = 'Curl Aranha';

-- TRICÍPITE
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=vB5OHsJ3EME' WHERE name = 'Extensão de Tricípite na Polia (Corda)';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=2-LAMcpzODU' WHERE name = 'Extensão de Tricípite na Polia (Barra V)';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=d_KZxkY_0cM' WHERE name = 'Press Francês com Halter';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=2z8JmcrW-As' WHERE name = 'Fundos em Paralelas (Dips)';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=6SS6K3lAwZ8' WHERE name = 'Kickback com Halter';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=d_KZxkY_0cM' WHERE name = 'Extensão de Tricípite Testa (Skullcrusher)';

-- CORE
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=Xyd_fa5zoEU' WHERE name = 'Crunch Abdominal no Chão';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=ASdvN_XEl_c' WHERE name = 'Prancha Abdominal';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=3lDMKEQAlEE' WHERE name = 'Roda Abdominal (Ab Wheel)';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=JB2oyawG9KI' WHERE name = 'Levantamento de Pernas em Suspensão';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=wkD8rjkodUI' WHERE name = 'Russian Twist com Disco';
UPDATE public.exercises SET demo_url = 'https://www.youtube.com/watch?v=jGNDW1AaOl8' WHERE name = 'Abdominal Declinado';
