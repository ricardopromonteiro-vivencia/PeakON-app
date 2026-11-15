# Sistema de Notificações Push - PeakON

## 📋 Visão Geral

Sistema completo de notificações push que notifica clientes quando um Personal Trainer atribui um novo plano de treino.

## ✨ Funcionalidades

- ✅ Notificação automática quando um PT atribui um plano de treino
- ✅ Badge vermelho no ícone do menu quando há notificações não lidas
- ✅ Página dedicada de notificações acessível pelo menu
- ✅ Contador de notificações não lidas no menu
- ✅ Atualização em tempo real usando Supabase Realtime
- ✅ Marcar notificações individuais como lidas
- ✅ Marcar todas as notificações como lidas
- ✅ Apagar notificações individualmente
- ✅ Navegação contextual baseada no tipo de notificação

## 🗄️ Instalação do Schema

### 1. Executar o SQL no Supabase

Aceda ao Supabase Dashboard → SQL Editor e execute o ficheiro:

```
supabase_notifications_schema.sql
```

Este script cria:
- Tabela `notifications` com políticas RLS
- Trigger automático para criar notificações quando um plano é atribuído
- Funções auxiliares para gestão de notificações

### 2. Verificar a Instalação

Execute no SQL Editor:

```sql
-- Verificar se a tabela foi criada
SELECT * FROM notifications LIMIT 1;

-- Verificar se o trigger existe
SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_notify_new_plan';

-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

## 🚀 Como Funciona

### Fluxo Automático

1. **PT atribui um plano**: Quando um PT atualiza o campo `assigned_plan_id` de um cliente na tabela `users`
2. **Trigger dispara**: O trigger `trigger_notify_new_plan` é automaticamente executado
3. **Notificação criada**: Uma nova notificação é inserida na tabela `notifications`
4. **Cliente é notificado**: O cliente vê:
   - Badge vermelho no ícone do menu (3 traços)
   - Contador no menu lateral
   - Notificação na página de notificações

### Componentes Criados

#### 1. **Base de Dados**
- `supabase_notifications_schema.sql` - Schema completo com triggers

#### 2. **Biblioteca de Notificações**
- `src/lib/notifications.js` - Funções para:
  - Obter notificações
  - Contar notificações não lidas
  - Marcar como lida(s)
  - Apagar notificações
  - Subscrever a mudanças em tempo real

#### 3. **Página de Notificações**
- `src/pages/Notifications.jsx` - Interface completa de notificações

#### 4. **Store Atualizado**
- `src/store/useAppStore.js` - Agora inclui:
  - `unreadNotifications` - contador de notificações não lidas
  - `loadUnreadCount()` - carrega contagem
  - Subscrição automática em tempo real

#### 5. **Layout Atualizado**
- `src/components/Layout.jsx` - Agora mostra:
  - Badge vermelho no ícone do menu quando há notificações não lidas
  - Item "Notificações" no menu com contador

#### 6. **Rotas Atualizadas**
- `src/App.jsx` - Nova rota `/notifications` para todos os roles

## 🎨 UI/UX

### Badge no Menu
- Badge vermelho aparece no canto superior direito do ícone do menu (3 traços)
- Visível apenas quando há notificações não lidas

### Item no Menu
- Primeiro item do menu lateral
- Mostra contador de notificações não lidas (ex: "5", "99+")
- Ícone de sino

### Página de Notificações

#### Notificações Não Lidas
- Fundo azul claro (`primary-container`)
- Texto destacado
- Bolinha azul no canto superior direito
- Anel azul ao redor

#### Notificações Lidas
- Fundo cinzento neutro (`surface-container`)
- Texto suave

#### Funcionalidades
- **Clicar na notificação**: Marca como lida e navega para a página relevante
- **Botão "×"**: Apaga a notificação
- **"Marcar todas como lidas"**: Aparece no topo quando há notificações não lidas
- **Timestamps relativos**: "Agora mesmo", "Há 5 min", "Há 3h", "Há 2d"

## 🔔 Tipos de Notificações

Atualmente implementado:
- **`new_plan`**: Novo plano de treino atribuído

### Estrutura de uma Notificação

```javascript
{
  id: "uuid",
  user_id: "uuid",
  type: "new_plan",
  title: "🏋️ Novo Plano de Treino!",
  message: "O teu Personal Trainer atribuiu-te um novo plano de treino...",
  data: {
    plan_id: "uuid",
    pt_id: "uuid"
  },
  read: false,
  created_at: "2024-01-15T10:30:00Z"
}
```

## 🔧 Personalização

### Adicionar Novos Tipos de Notificações

1. **Criar trigger ou chamar função manualmente**:

```sql
-- Exemplo: Notificar quando uma sessão é marcada
CREATE OR REPLACE FUNCTION notify_booking_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.client_id,
      'booking_confirmed',
      '✅ Sessão Confirmada',
      'A tua sessão foi confirmada para ' || NEW.start_time::text,
      jsonb_build_object('booking_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

2. **Atualizar navegação em `Notifications.jsx`**:

```javascript
function handleNotificationClick(notification) {
  if (!notification.read) {
    handleMarkAsRead(notification.id);
  }

  // Adicionar novo tipo
  if (notification.type === 'booking_confirmed' && notification.data?.booking_id) {
    navigate('/agenda');
  }
}
```

### Personalizar Aparência

Cores e estilos estão em:
- `src/pages/Notifications.jsx` - Componentes da página
- `src/components/Layout.jsx` - Badge e menu
- Tailwind classes usam o design system do Material You

## 📱 Suporte para Push Notifications (Futuro)

Para adicionar notificações push nativas (Web Push API):

1. Adicionar Service Worker
2. Registar push subscription
3. Enviar push notification do servidor
4. Integrar com Firebase Cloud Messaging ou similar

## 🧪 Testar o Sistema

### 1. Criar uma Notificação de Teste

No Supabase SQL Editor:

```sql
-- Substituir USER_ID pelo UUID do cliente
INSERT INTO notifications (user_id, type, title, message, data)
VALUES (
  'SEU_USER_ID_AQUI',
  'new_plan',
  '🏋️ Novo Plano de Treino!',
  'O teu Personal Trainer atribuiu-te um novo plano de treino. Vê os detalhes e começa já!',
  '{"plan_id": "123", "pt_id": "456"}'::jsonb
);
```

### 2. Atribuir um Plano (Teste Real)

Como PT, atribua um plano a um cliente:

```sql
-- Substituir CLIENT_ID e PLAN_ID
UPDATE users 
SET assigned_plan_id = 'PLAN_ID'
WHERE id = 'CLIENT_ID';
```

O trigger irá automaticamente criar a notificação!

### 3. Verificar a UI

1. Login como cliente
2. Verificar badge vermelho no ícone do menu
3. Abrir menu e ver contador
4. Clicar em "Notificações"
5. Ver a notificação não lida (fundo azul)
6. Clicar na notificação (marca como lida e navega)

## 🔒 Segurança

- ✅ RLS (Row Level Security) ativado
- ✅ Clientes só veem as suas notificações
- ✅ Clientes só podem atualizar as suas notificações
- ✅ Inserção controlada por triggers/functions SECURITY DEFINER

## 📊 Performance

- ✅ Índices otimizados para queries frequentes
- ✅ Realtime subscription eficiente
- ✅ Limpeza automática de notificações antigas (função disponível)

### Executar Limpeza Manual

```sql
-- Apagar notificações com mais de 30 dias
SELECT cleanup_old_notifications();
```

## 🐛 Resolução de Problemas

### Notificações não aparecem

1. Verificar se o trigger está ativo:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_notify_new_plan';
```

2. Verificar logs de erro no Supabase

3. Verificar políticas RLS:
```sql
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

### Badge não atualiza em tempo real

1. Verificar subscrição no browser console
2. Verificar se Realtime está ativado no Supabase
3. Refresh da página (subscrição é criada no mount)

### Contador errado

Forçar recontagem:
```javascript
// No browser console
useAppStore.getState().loadUnreadCount();
```

## 📝 Notas Importantes

- O sistema usa Supabase Realtime - certifique-se que está ativado no projeto
- Notificações antigas (>30 dias) podem ser limpas periodicamente
- O badge desaparece automaticamente quando todas as notificações são lidas
- Suporte para múltiplos tipos de notificações já está preparado

## 🚀 Próximos Passos

- [ ] Adicionar notificações para reservas de sessões
- [ ] Adicionar notificações para mensagens do PT
- [ ] Implementar Web Push API para notificações nativas
- [ ] Adicionar preferências de notificação no perfil
- [ ] Adicionar sons/vibrações para novas notificações
- [ ] Implementar notificações por email

---

**Desenvolvido para PeakON** 🏋️‍♂️
