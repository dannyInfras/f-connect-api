-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.articles (
  id integer NOT NULL DEFAULT nextval('articles_id_seq'::regclass),
  title character varying NOT NULL,
  post character varying NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  authorId integer,
  CONSTRAINT articles_pkey PRIMARY KEY (id),
  CONSTRAINT FK_65d9ccc1b02f4d904e90bd76a34 FOREIGN KEY (authorId) REFERENCES public.users(id)
);
CREATE TABLE public.background (
  id bigint NOT NULL DEFAULT nextval('background_id_seq'::regclass),
  workspace_id bigint NOT NULL,
  user_create_id bigint NOT NULL,
  category_id bigint NOT NULL,
  path character varying NOT NULL,
  title character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT background_pkey PRIMARY KEY (id),
  CONSTRAINT fk_background_user_create_id FOREIGN KEY (user_create_id) REFERENCES public.users(id),
  CONSTRAINT fk_background_workspace_id FOREIGN KEY (workspace_id) REFERENCES public.workspace(id)
);
CREATE TABLE public.benefit (
  id bigint NOT NULL DEFAULT nextval('benefit_id_seq'::regclass),
  name character varying NOT NULL,
  description text NOT NULL,
  icon_url character varying NOT NULL,
  company_id bigint,
  CONSTRAINT benefit_pkey PRIMARY KEY (id),
  CONSTRAINT FK_f063151550a2280deb54037af30 FOREIGN KEY (company_id) REFERENCES public.company(id)
);
CREATE TABLE public.calendar (
  id bigint NOT NULL DEFAULT nextval('calendar_id_seq'::regclass),
  workspace_id bigint NOT NULL,
  title character varying NOT NULL,
  start_time timestamp without time zone NOT NULL,
  end_time timestamp without time zone,
  description text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT calendar_pkey PRIMARY KEY (id),
  CONSTRAINT fk_calendar_workspace_id FOREIGN KEY (workspace_id) REFERENCES public.workspace(id)
);
CREATE TABLE public.candidate_bookmark (
  id bigint NOT NULL DEFAULT nextval('candidate_bookmark_id_seq'::regclass),
  company_id bigint NOT NULL,
  candidate_profile_id bigint NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT candidate_bookmark_pkey PRIMARY KEY (id),
  CONSTRAINT fk_candidate_bookmark_candidate_profile_id FOREIGN KEY (candidate_profile_id) REFERENCES public.candidate_profile(id),
  CONSTRAINT fk_candidate_bookmark_company_id FOREIGN KEY (company_id) REFERENCES public.company(id)
);
CREATE TABLE public.candidate_profile (
  id bigint NOT NULL DEFAULT nextval('candidate_profile_id_seq'::regclass),
  description text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  title character varying,
  company character varying,
  location character varying,
  avatar character varying,
  coverImage character varying,
  isOpenToOpportunities boolean NOT NULL DEFAULT false,
  about text,
  birthDate character varying,
  user_id integer UNIQUE,
  contact jsonb,
  social jsonb,
  CONSTRAINT candidate_profile_pkey PRIMARY KEY (id),
  CONSTRAINT FK_ce664e2dbb3f03521bcdd2c7bf0 FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.candidate_skill (
  id bigint NOT NULL DEFAULT nextval('candidate_skill_id_seq'::regclass),
  candidate_profile_id bigint NOT NULL,
  skill_id bigint NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  proficiencyLevel character varying,
  CONSTRAINT candidate_skill_pkey PRIMARY KEY (id),
  CONSTRAINT FK_fcb69c0e9e78c9ebdaa667fedfa FOREIGN KEY (skill_id) REFERENCES public.skill(id),
  CONSTRAINT FK_8430e406377f3568574baa2c990 FOREIGN KEY (candidate_profile_id) REFERENCES public.candidate_profile(id)
);
CREATE TABLE public.category (
  id bigint NOT NULL DEFAULT nextval('category_id_seq'::regclass),
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  name character varying NOT NULL UNIQUE,
  CONSTRAINT category_pkey PRIMARY KEY (id)
);
CREATE TABLE public.company (
  id bigint NOT NULL DEFAULT nextval('company_id_seq'::regclass),
  company_name character varying NOT NULL,
  tax_code character varying NOT NULL UNIQUE,
  industry character varying,
  description text,
  logo_url character varying,
  business_license_url character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  founded_at timestamp without time zone,
  employees integer,
  website character varying,
  socialMedia ARRAY,
  workImageUrl ARRAY,
  address ARRAY,
  phone integer,
  email character varying,
  CONSTRAINT company_pkey PRIMARY KEY (id)
);
CREATE TABLE public.core_team (
  id bigint NOT NULL DEFAULT nextval('core_team_id_seq'::regclass),
  name character varying NOT NULL,
  position character varying NOT NULL,
  image_url character varying NOT NULL,
  company_id bigint,
  CONSTRAINT core_team_pkey PRIMARY KEY (id),
  CONSTRAINT FK_52a2a1c2fd9af420e5a4f8a8db8 FOREIGN KEY (company_id) REFERENCES public.company(id)
);
CREATE TABLE public.coupon (
  id bigint NOT NULL DEFAULT nextval('coupon_id_seq'::regclass),
  code character varying NOT NULL UNIQUE,
  discount_percentage numeric NOT NULL,
  valid_until date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT coupon_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cv (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title character varying NOT NULL,
  summary text,
  experience jsonb DEFAULT '[]'::jsonb,
  education jsonb DEFAULT '[]'::jsonb,
  skills text,
  certifications jsonb DEFAULT '[]'::jsonb,
  languages text,
  templateId integer,
  user_id integer NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT cv_pkey PRIMARY KEY (id),
  CONSTRAINT FK_user_cv FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.cv_skill (
  cv_id bigint NOT NULL,
  skill_id bigint NOT NULL,
  proficiency_level character varying DEFAULT 'BEGINNER'::character varying CHECK (proficiency_level::text = ANY (ARRAY['BEGINNER'::character varying, 'INTERMEDIATE'::character varying, 'ADVANCED'::character varying]::text[])),
  CONSTRAINT cv_skill_pkey PRIMARY KEY (cv_id, skill_id),
  CONSTRAINT fk_cv_skill_skill_id FOREIGN KEY (skill_id) REFERENCES public.skill(id)
);
CREATE TABLE public.education (
  id bigint NOT NULL DEFAULT nextval('education_id_seq'::regclass),
  institution character varying NOT NULL,
  degree character varying,
  field character varying,
  startYear integer NOT NULL,
  endYear integer,
  description text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  candidate_profile_id bigint NOT NULL,
  CONSTRAINT education_pkey PRIMARY KEY (id),
  CONSTRAINT FK_3483140e84f8fb01e78793ecb98 FOREIGN KEY (candidate_profile_id) REFERENCES public.candidate_profile(id)
);
CREATE TABLE public.email_verification_tokens (
  id integer NOT NULL DEFAULT nextval('email_verification_tokens_id_seq'::regclass),
  user_id integer NOT NULL,
  token character varying NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT FK_fdcb77f72f529bf65c95d72a147 FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.experience (
  id bigint NOT NULL DEFAULT nextval('experience_id_seq'::regclass),
  candidate_profile_id bigint NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  company character varying,
  role character varying NOT NULL,
  employment_type USER-DEFINED,
  location character varying,
  CONSTRAINT experience_pkey PRIMARY KEY (id),
  CONSTRAINT FK_7955b5bea11080df955b604055c FOREIGN KEY (candidate_profile_id) REFERENCES public.candidate_profile(id)
);
CREATE TABLE public.hired_candidate (
  id bigint NOT NULL DEFAULT nextval('hired_candidate_id_seq'::regclass),
  user_id bigint NOT NULL,
  job_id bigint NOT NULL,
  company_id bigint NOT NULL,
  position character varying,
  hired_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  status character varying DEFAULT 'ACTIVE'::character varying CHECK (status::text = ANY (ARRAY['ACTIVE'::character varying, 'LEFT'::character varying]::text[])),
  CONSTRAINT hired_candidate_pkey PRIMARY KEY (id),
  CONSTRAINT fk_hired_candidate_job_id FOREIGN KEY (job_id) REFERENCES public.job(id),
  CONSTRAINT fk_hired_candidate_company_id FOREIGN KEY (company_id) REFERENCES public.company(id),
  CONSTRAINT fk_hired_candidate_user_id FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.job (
  id bigint NOT NULL DEFAULT nextval('job_id_seq'::regclass),
  category_id bigint,
  company_id bigint,
  title character varying NOT NULL,
  description text NOT NULL,
  location character varying,
  salary_min numeric,
  salary_max numeric,
  experience_years integer,
  is_vip boolean NOT NULL DEFAULT false,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  typeOfEmployment USER-DEFINED NOT NULL DEFAULT 'FullTime'::job_typeofemployment_enum,
  deadline timestamp without time zone NOT NULL,
  responsibility ARRAY NOT NULL,
  jobFitAttributes ARRAY NOT NULL,
  niceToHave ARRAY NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'OPEN'::job_status_enum,
  benefit ARRAY NOT NULL,
  CONSTRAINT job_pkey PRIMARY KEY (id),
  CONSTRAINT FK_51cb12c924d3e8c7465cc8edff2 FOREIGN KEY (company_id) REFERENCES public.company(id),
  CONSTRAINT FK_15f44c4b9fbb84e28a0346e930f FOREIGN KEY (category_id) REFERENCES public.category(id)
);
CREATE TABLE public.job_application (
  id bigint NOT NULL DEFAULT nextval('job_application_id_seq'::regclass),
  user_id bigint NOT NULL,
  job_id bigint NOT NULL,
  cv_id bigint,
  status character varying DEFAULT 'APPLIED'::character varying CHECK (status::text = ANY (ARRAY['APPLIED'::character varying, 'INTERVIEW'::character varying, 'HIRED'::character varying, 'REJECTED'::character varying]::text[])),
  applied_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT job_application_pkey PRIMARY KEY (id),
  CONSTRAINT fk_job_application_user_id FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT fk_job_application_job_id FOREIGN KEY (job_id) REFERENCES public.job(id)
);
CREATE TABLE public.job_skill (
  job_id bigint NOT NULL,
  skill_id bigint NOT NULL,
  CONSTRAINT job_skill_pkey PRIMARY KEY (job_id, skill_id),
  CONSTRAINT FK_380feeef9ae48bb593b5acd9232 FOREIGN KEY (skill_id) REFERENCES public.skill(id),
  CONSTRAINT FK_57d07c4be198a93a91fa8479819 FOREIGN KEY (job_id) REFERENCES public.job(id)
);
CREATE TABLE public.migrations (
  id integer NOT NULL DEFAULT nextval('migrations_id_seq'::regclass),
  timestamp bigint NOT NULL,
  name character varying NOT NULL,
  CONSTRAINT migrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.music (
  id bigint NOT NULL DEFAULT nextval('music_id_seq'::regclass),
  workspace_id bigint NOT NULL,
  user_create_id bigint NOT NULL,
  category_id bigint NOT NULL,
  path character varying NOT NULL,
  title character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT music_pkey PRIMARY KEY (id),
  CONSTRAINT fk_music_user_create_id FOREIGN KEY (user_create_id) REFERENCES public.users(id),
  CONSTRAINT fk_music_workspace_id FOREIGN KEY (workspace_id) REFERENCES public.workspace(id)
);
CREATE TABLE public.notification (
  id bigint NOT NULL DEFAULT nextval('notification_id_seq'::regclass),
  user_id bigint,
  title character varying NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notification_pkey PRIMARY KEY (id),
  CONSTRAINT fk_notification_user_id FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.package (
  id bigint NOT NULL DEFAULT nextval('package_id_seq'::regclass),
  name character varying NOT NULL,
  description text,
  price numeric NOT NULL,
  duration_days integer NOT NULL,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['USER_VIP'::character varying, 'COMPANY_VIP'::character varying]::text[])),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT package_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payment (
  id bigint NOT NULL DEFAULT nextval('payment_id_seq'::regclass),
  user_id bigint NOT NULL,
  package_id bigint NOT NULL,
  coupon_id bigint,
  amount numeric NOT NULL,
  payment_method character varying NOT NULL CHECK (payment_method::text = ANY (ARRAY['VISA'::character varying, 'MOMO'::character varying, 'VNPAY'::character varying, 'PAYOS'::character varying]::text[])),
  status character varying DEFAULT 'PENDING'::character varying CHECK (status::text = ANY (ARRAY['PENDING'::character varying, 'SUCCESS'::character varying, 'FAILED'::character varying]::text[])),
  transaction_id character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT payment_pkey PRIMARY KEY (id),
  CONSTRAINT fk_payment_package_id FOREIGN KEY (package_id) REFERENCES public.package(id),
  CONSTRAINT fk_payment_coupon_id FOREIGN KEY (coupon_id) REFERENCES public.coupon(id),
  CONSTRAINT fk_payment_user_id FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.skill (
  id bigint NOT NULL DEFAULT nextval('skill_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT skill_pkey PRIMARY KEY (id)
);
CREATE TABLE public.task (
  id bigint NOT NULL DEFAULT nextval('task_id_seq'::regclass),
  workspace_id bigint NOT NULL,
  title character varying NOT NULL,
  description text,
  status character varying DEFAULT 'TODO'::character varying CHECK (status::text = ANY (ARRAY['TODO'::character varying, 'IN_PROGRESS'::character varying, 'DONE'::character varying]::text[])),
  due_date date,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT task_pkey PRIMARY KEY (id),
  CONSTRAINT fk_task_workspace_id FOREIGN KEY (workspace_id) REFERENCES public.workspace(id)
);
CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  full_name character varying NOT NULL,
  password character varying NOT NULL,
  username character varying NOT NULL UNIQUE,
  roles text NOT NULL,
  is_account_disabled boolean NOT NULL DEFAULT true,
  email character varying NOT NULL UNIQUE,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  phone character varying UNIQUE,
  companyId bigint,
  gender USER-DEFINED,
  avatar character varying,
  dob timestamp without time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT FK_6f9395c9037632a31107c8a9e58 FOREIGN KEY (companyId) REFERENCES public.company(id)
);
CREATE TABLE public.workspace (
  id bigint NOT NULL DEFAULT nextval('workspace_id_seq'::regclass),
  name character varying NOT NULL,
  privacy character varying NOT NULL DEFAULT 'private'::character varying CHECK (privacy::text = ANY (ARRAY['public'::character varying, 'private'::character varying]::text[])),
  max_members integer DEFAULT 50,
  image_url character varying,
  category character varying,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'ban'::character varying, 'pending'::character varying]::text[])),
  invite_link character varying,
  owner_id bigint NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT workspace_pkey PRIMARY KEY (id),
  CONSTRAINT fk_workspace_owner_id FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.workspace_chat (
  id bigint NOT NULL DEFAULT nextval('workspace_chat_id_seq'::regclass),
  workspace_id bigint NOT NULL,
  sender_id bigint,
  message text NOT NULL,
  sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT workspace_chat_pkey PRIMARY KEY (id),
  CONSTRAINT fk_workspace_chat_sender_id FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT fk_workspace_chat_workspace_id FOREIGN KEY (workspace_id) REFERENCES public.workspace(id)
);
