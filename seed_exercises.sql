-- Script de injeção massiva do catálogo global base da PeakON
-- Estes exercícios ficarão disponíveis para todos os PTs registados.

INSERT INTO public.exercises (name, category, equipment, demo_url) VALUES
-- PEITO
('Supino Plano com Barra', 'Peito', 'Barra', 'https://www.youtube.com/watch?v=rT7DgCr-3pg'),
('Supino Inclinado com Halteres', 'Peito', 'Halteres', 'https://www.youtube.com/watch?v=8iPEnn-ltC8'),
('Crucifixo na Máquina (Peck Deck)', 'Peito', 'Máquina', 'https://www.youtube.com/watch?v=Iwe6AmxVf7o'),
('Crossover em Polia Baixa', 'Peito', 'Polia', 'https://www.youtube.com/watch?v=taI4XduLpTk'),
('Crossover em Polia Alta', 'Peito', 'Polia', 'https://www.youtube.com/watch?v=X7_MkB7PVHQ'),
('Flexões de Braços', 'Peito', 'Peso Corporal', 'https://www.youtube.com/watch?v=IODxDxX7oi4'),
('Supino Declinado com Máquina', 'Peito', 'Máquina', 'https://www.youtube.com/watch?v=4Y2ZsFaQ4P0'),
('Press de Peito em Máquina', 'Peito', 'Máquina', 'https://www.youtube.com/watch?v=xUm0BiZCWlQ'),

-- COSTAS
('Puxada Frontal (Lat Pulldown)', 'Costas', 'Máquina/Polia', 'https://www.youtube.com/watch?v=CAwf7n6Luuc'),
('Remada Curvada com Barra', 'Costas', 'Barra', 'https://www.youtube.com/watch?v=9efgcAjQe7E'),
('Remada Sentada em Polia Baixa', 'Costas', 'Polia', 'https://www.youtube.com/watch?v=GZbfZ033f74'),
('Elevação em Barra Fixa (Pull-ups)', 'Costas', 'Peso Corporal', 'https://www.youtube.com/watch?v=eGo4IYlbE5g'),
('Pulldown com Corda (Braços Esticados)', 'Costas', 'Polia', 'https://www.youtube.com/watch?v=M89J0FzHMEg'),
('Remada Unilateral com Halter (Serrote)', 'Costas', 'Halter', 'https://www.youtube.com/watch?v=pYcpY20QaE8'),
('Remada Cavalinho (T-Bar)', 'Costas', 'Máquina/Barra', 'https://www.youtube.com/watch?v=j3SKO6-lQoo'),
('Lombar no Banco Romano', 'Costas', 'Peso Corporal/Peso', 'https://www.youtube.com/watch?v=ph3pddpKzzw'),

-- PERNA
('Agachamento Livre com Barra', 'Perna', 'Barra', 'https://www.youtube.com/watch?v=ultWZbUMPL8'),
('Leg Press 45º', 'Perna', 'Máquina', 'https://www.youtube.com/watch?v=IZxyjW7MPJQ'),
('Cadeira Extensora', 'Perna', 'Máquina', 'https://www.youtube.com/watch?v=YyvSfVjQeL0'),
('Cadeira Flexora', 'Perna', 'Máquina', 'https://www.youtube.com/watch?v=1Tq3QdYUuHs'),
('Mesa Flexora', 'Perna', 'Máquina', 'https://www.youtube.com/watch?v=vHDVMNHhLCE'),
('Agachamento Búlgaro com Halteres', 'Perna', 'Halteres', 'https://www.youtube.com/watch?v=2C-uNgKwPLE'),
('Elevação Pélvica (Hip Thrust)', 'Perna', 'Barra/Máquina', 'https://www.youtube.com/watch?v=SEdqd1n0cvg'),
('Prensa de Gémeos no Leg Press', 'Perna', 'Máquina', 'https://www.youtube.com/watch?v=XHBMoMQelcI'),
('Prensa de Gémeos Sentado', 'Perna', 'Máquina', 'https://www.youtube.com/watch?v=JbyjNymZOt0'),
('Afundos Fixos (Lunges)', 'Perna', 'Halteres', 'https://www.youtube.com/watch?v=QOVaHwm-Q6U'),
('Stiff (Peso Morto Romeno)', 'Perna', 'Barra', 'https://www.youtube.com/watch?v=1uDiW5--rAE'),

-- OMBRO
('Desenvolvimento com Halteres', 'Ombro', 'Halteres', 'https://www.youtube.com/watch?v=qEwKCR5JCog'),
('Elevação Lateral com Halteres', 'Ombro', 'Halteres', 'https://www.youtube.com/watch?v=3VcKaXpzqRo'),
('Elevação Frontal com Polia', 'Ombro', 'Polia', 'https://www.youtube.com/watch?v=sOgc1PXNQ3w'),
('Crucifixo Invertido na Máquina', 'Ombro', 'Máquina', 'https://www.youtube.com/watch?v=Wjgj1KUIVJE'),
('Desenvolvimento Militar com Barra', 'Ombro', 'Barra', 'https://www.youtube.com/watch?v=2yjwXTZQDDI'),
('Remada Alta com Barra (Upright Row)', 'Ombro', 'Barra/Polia', 'https://www.youtube.com/watch?v=jOgvGUbOwTo'),
('Elevação Lateral na Polia', 'Ombro', 'Polia', 'https://www.youtube.com/watch?v=PPDTkJDRnPM'),

-- BICÍPITE
('Curl com Barra W', 'Bicípite', 'Barra', 'https://www.youtube.com/watch?v=kwG2ipFRgfo'),
('Curl Alternado com Halteres', 'Bicípite', 'Halteres', 'https://www.youtube.com/watch?v=sAq_ocpRh_I'),
('Curl Martelo com Halteres', 'Bicípite', 'Halteres', 'https://www.youtube.com/watch?v=TwD-YGVP4Bk'),
('Curl em Polia Baixa (Corda ou Barra)', 'Bicípite', 'Polia', 'https://www.youtube.com/watch?v=J2gqMoFbz3o'),
('Curl Concentrado no Banco Scott', 'Bicípite', 'Halter/Barra/Máquina', 'https://www.youtube.com/watch?v=MVMNk0HiTMo'),
('Curl Aranha', 'Bicípite', 'Barra/Halter', 'https://www.youtube.com/watch?v=Cp1cBT0iq1U'),

-- TRICÍPITE
('Extensão de Tricípite na Polia (Corda)', 'Tricípite', 'Polia', 'https://www.youtube.com/watch?v=vB5OHsJ3EME'),
('Extensão de Tricípite na Polia (Barra V)', 'Tricípite', 'Polia', 'https://www.youtube.com/watch?v=2-LAMcpzODU'),
('Press Francês com Halter', 'Tricípite', 'Halter', 'https://www.youtube.com/watch?v=d_KZxkY_0cM'),
('Fundos em Paralelas (Dips)', 'Tricípite', 'Peso Corporal', 'https://www.youtube.com/watch?v=2z8JmcrW-As'),
('Kickback com Halter', 'Tricípite', 'Halter', 'https://www.youtube.com/watch?v=6SS6K3lAwZ8'),
('Extensão de Tricípite Testa (Skullcrusher)', 'Tricípite', 'Barra', 'https://www.youtube.com/watch?v=d_KZxkY_0cM'),

-- CORE (ABDOMINAL)
('Crunch Abdominal no Chão', 'Core', 'Peso Corporal', 'https://www.youtube.com/watch?v=Xyd_fa5zoEU'),
('Prancha Abdominal', 'Core', 'Peso Corporal', 'https://www.youtube.com/watch?v=ASdvN_XEl_c'),
('Roda Abdominal (Ab Wheel)', 'Core', 'Acessório', 'https://www.youtube.com/watch?v=3lDMKEQAlEE'),
('Levantamento de Pernas em Suspensão', 'Core', 'Peso Corporal', 'https://www.youtube.com/watch?v=JB2oyawG9KI'),
('Russian Twist com Disco', 'Core', 'Peso', 'https://www.youtube.com/watch?v=wkD8rjkodUI'),
('Abdominal Declinado', 'Core', 'Peso Corporal/Disco', 'https://www.youtube.com/watch?v=jGNDW1AaOl8');
