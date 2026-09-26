-- Script de injeção massiva do catálogo global base da PeakON
-- Estes exercícios ficarão disponíveis para todos os PTs registados.

INSERT INTO public.exercises (name, category, equipment) VALUES
-- PEITO
('Supino Plano com Barra', 'Peito', 'Barra'),
('Supino Inclinado com Halteres', 'Peito', 'Halteres'),
('Crucifixo na Máquina (Peck Deck)', 'Peito', 'Máquina'),
('Crossover em Polia Baixa', 'Peito', 'Polia'),
('Crossover em Polia Alta', 'Peito', 'Polia'),
('Flexões de Braços', 'Peito', 'Peso Corporal'),
('Supino Declinado com Máquina', 'Peito', 'Máquina'),
('Press de Peito em Máquina', 'Peito', 'Máquina'),

-- COSTAS
('Puxada Frontal (Lat Pulldown)', 'Costas', 'Máquina/Polia'),
('Remada Curvada com Barra', 'Costas', 'Barra'),
('Remada Sentada em Polia Baixa', 'Costas', 'Polia'),
('Elevação em Barra Fixa (Pull-ups)', 'Costas', 'Peso Corporal'),
('Pulldown com Corda (Braços Esticados)', 'Costas', 'Polia'),
('Remada Unilateral com Halter (Serrote)', 'Costas', 'Halter'),
('Remada Cavalinho (T-Bar)', 'Costas', 'Máquina/Barra'),
('Lombar no Banco Romano', 'Costas', 'Peso Corporal/Peso'),

-- PERNA
('Agachamento Livre com Barra', 'Perna', 'Barra'),
('Leg Press 45º', 'Perna', 'Máquina'),
('Cadeira Extensora', 'Perna', 'Máquina'),
('Cadeira Flexora', 'Perna', 'Máquina'),
('Mesa Flexora', 'Perna', 'Máquina'),
('Agachamento Búlgaro com Halteres', 'Perna', 'Halteres'),
('Elevação Pélvica (Hip Thrust)', 'Perna', 'Barra/Máquina'),
('Prensa de Gémeos no Leg Press', 'Perna', 'Máquina'),
('Prensa de Gémeos Sentado', 'Perna', 'Máquina'),
('Afundos Fixos (Lunges)', 'Perna', 'Halteres'),
('Stiff (Peso Morto Romeno)', 'Perna', 'Barra'),

-- OMBRO
('Desenvolvimento com Halteres', 'Ombro', 'Halteres'),
('Elevação Lateral com Halteres', 'Ombro', 'Halteres'),
('Elevação Frontal com Polia', 'Ombro', 'Polia'),
('Crucifixo Invertido na Máquina', 'Ombro', 'Máquina'),
('Desenvolvimento Militar com Barra', 'Ombro', 'Barra'),
('Remada Alta com Barra (Upright Row)', 'Ombro', 'Barra/Polia'),
('Elevação Lateral na Polia', 'Ombro', 'Polia'),

-- BICÍPITE
('Curl com Barra W', 'Bicípite', 'Barra'),
('Curl Alternado com Halteres', 'Bicípite', 'Halteres'),
('Curl Martelo com Halteres', 'Bicípite', 'Halteres'),
('Curl em Polia Baixa (Corda ou Barra)', 'Bicípite', 'Polia'),
('Curl Concentrado no Banco Scott', 'Bicípite', 'Halter/Barra/Máquina'),
('Curl Aranha', 'Bicípite', 'Barra/Halter'),

-- TRICÍPITE
('Extensão de Tricípite na Polia (Corda)', 'Tricípite', 'Polia'),
('Extensão de Tricípite na Polia (Barra V)', 'Tricípite', 'Polia'),
('Press Francês com Halter', 'Tricípite', 'Halter'),
('Fundos em Paralelas (Dips)', 'Tricípite', 'Peso Corporal'),
('Kickback com Halter', 'Tricípite', 'Halter'),
('Extensão de Tricípite Testa (Skullcrusher)', 'Tricípite', 'Barra'),

-- CORE (ABDOMINAL)
('Crunch Abdominal no Chão', 'Core', 'Peso Corporal'),
('Prancha Abdominal', 'Core', 'Peso Corporal'),
('Roda Abdominal (Ab Wheel)', 'Core', 'Acessório'),
('Levantamento de Pernas em Suspensão', 'Core', 'Peso Corporal'),
('Russian Twist com Disco', 'Core', 'Peso'),
('Abdominal Declinado', 'Core', 'Peso Corporal/Disco');
