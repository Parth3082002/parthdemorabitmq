-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
--
-- Betting rounds: use games.status = 'open' (accepting bets) or 'settled' (result published).
-- games.published_number stores the winning digit/number for that round (varchar for flexibility).

CREATE TABLE public.admins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username character varying NOT NULL UNIQUE,
  password text NOT NULL,
  role character varying DEFAULT 'admin'::character varying,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT admins_pkey PRIMARY KEY (id)
);
CREATE TABLE public.bets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_id uuid,
  amount numeric NOT NULL,
  bet_number character varying,
  status character varying DEFAULT 'pending'::character varying,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT bets_pkey PRIMARY KEY (id),
  CONSTRAINT bets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT bets_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id)
);
CREATE TABLE public.games (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  game_name character varying NOT NULL,
  status character varying DEFAULT 'open'::character varying,
  published_number character varying,
  published_at timestamp with time zone,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT games_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id character varying NOT NULL UNIQUE,
  phone_number character varying NOT NULL UNIQUE,
  password text NOT NULL,
  status character varying DEFAULT 'active'::character varying,
  created_by uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admins(id)
);
CREATE TABLE public.wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type character varying NOT NULL,
  amount numeric NOT NULL,
  before_balance numeric NOT NULL,
  after_balance numeric NOT NULL,
  created_by uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT wallet_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admins(id)
);
-- wallet_transactions.type examples: deposit, withdraw, bet_stake, bet_win
CREATE TABLE public.wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric DEFAULT 0,
  total_deposit numeric DEFAULT 0,
  total_withdraw numeric DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT wallets_pkey PRIMARY KEY (id),
  CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Helpful indexes for ~100 concurrent users / small bet volume
CREATE INDEX IF NOT EXISTS idx_bets_game_status ON public.bets (game_id, status);
CREATE INDEX IF NOT EXISTS idx_bets_user ON public.bets (user_id);
CREATE INDEX IF NOT EXISTS idx_games_status_created ON public.games (status, created_at DESC);

-- If you already created games without the new columns, run:
-- ALTER TABLE public.games ADD COLUMN IF NOT EXISTS published_number character varying;
-- ALTER TABLE public.games ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;