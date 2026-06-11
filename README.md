# LocalOps White Label

MVP SaaS основа за салони, студиа и локални бизнеси за услуги.

Основно обещание: пусни страница за резервации, CRM, фуния за запитвания, напомняния и система за заявки за отзиви за локален бизнес в рамките на един ден.

## Технологии

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase Postgres архитектура
- Готовност за Vercel публикуване

## Стартиране локално

Инсталирай зависимостите:

```bash
npm install
```

Създай локален файл с настройки:

```bash
cp .env.example .env.local
```

Добави Supabase URL и публичния ключ в `.env.local`.

Пусни локалния dev server:

```bash
npm run dev
```

Отвори [http://localhost:3000](http://localhost:3000) в браузъра.

## Налични пътища

- `/` публична начална страница
- `/register` регистрация на салон/локален бизнес
- `/login` вход
- `/forgot-password` заявка за смяна на парола
- `/onboarding` задължителна настройка на бизнес профил
- `/dashboard` защитена работна среда

## Какво е включено

- Supabase клиенти за браузър, сървър и middleware
- Сървърни auth actions за регистрация, вход, смяна на парола и изход
- Публична SaaS начална страница
- Защитен dashboard layout
- Self-serve onboarding flow за локален бизнес
- Основна странична навигация за MVP модулите
- Демо dashboard състояние за красота, дентални услуги и почистване

## Database миграции

Supabase схемата е в `supabase/migrations`:

- `20260610150000_initial_schema.sql` създава таблици, индекси, `updated_at` trigger-и, auth profile trigger, RLS helper функции и политики.
- `20260610150100_seed_demo_data.sql` добавя една demo partner агенция, три клиентски бизнеса, demo услуги, customers, leads, appointments, automation templates, messages, reviews и events.
- `20260610152000_partner_onboarding.sql` добавя branding settings, storage bucket/policies за лога и onboarding функция.
- `20260610162000_advisory_hardening.sql` затяга storage достъпа, function grants, RLS performance и foreign key индексите.
- `20260610163000_onboarding_security_invoker.sql` прави onboarding функцията `SECURITY INVOKER` и я прекарва през тесни RLS bootstrap политики.
- `20260610170000_business_self_onboarding.sql` добавя self-serve регистрация за салон/локален бизнес с business owner достъп.

Приложи миграциите със Supabase CLI:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

Алтернативно можеш да пуснеш SQL файловете ръчно в Supabase SQL editor, в реда на имената им.

RLS модел:

- Platform admin са профили с `role = 'platform_admin'` и имат достъп до всичко.
- Партньорският достъп идва от активни редове в `partner_users`.
- Бизнес достъпът идва от активни редове в `business_users`.
- Партньорските потребители виждат своя партньор и бизнесите под него.
- Бизнес потребителите виждат само редове, свързани с назначения им бизнес.
- Публичните записи за резервации умишлено не са отворени към `anon`; за публичен lead capture използвай server route или Edge Function с validation.

За да свържеш реален регистриран потребител с demo partner-а, добави неговия profile id в `partner_users` след регистрация.

## Следващи стъпки

1. Свързване на dashboard екраните с реалните business данни.
2. Изграждане на публични booking страници и lead capture.
3. Свързване на dashboard екраните със Supabase заявки.
4. Добавяне на email/SMS integrations за автоматизациите.
5. Добавяне на reporting views след доказване на основния flow.

## Проверки

```bash
npm run lint
npm run build
```

## Бележки

Dashboard-ът пренасочва към `/login`, когато няма Supabase session. Ако липсват Supabase настройки, защитените route-и пренасочват със setup грешка, така че чист clone да може да се build-не преди да са добавени credentials.
