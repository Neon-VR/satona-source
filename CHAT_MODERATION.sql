-- Apply in Supabase SQL Editor to enforce moderation beyond the browser UI.
-- Existing messages are left intact and are filtered when displayed by Satona.
create or replace function public.satona_contains_slur(value text)
returns boolean language sql immutable strict set search_path = public as $$
  select translate(lower(normalize(value, NFKC)), '013457@$!', 'oieastasi') ~
    '(^|[^a-z])(n[\W_]*i[\W_]*g[\W_]*g[\W_]*(e[\W_]*r|a)|f[\W_]*a[\W_]*g[\W_]*g[\W_]*o[\W_]*t|k[\W_]*i[\W_]*k[\W_]*e|c[\W_]*h[\W_]*i[\W_]*n[\W_]*k|s[\W_]*p[\W_]*i[\W_]*c|w[\W_]*e[\W_]*t[\W_]*b[\W_]*a[\W_]*c[\W_]*k|g[\W_]*o[\W_]*o[\W_]*k|t[\W_]*r[\W_]*a[\W_]*n[\W_]*n[\W_]*y|c[\W_]*o[\W_]*o[\W_]*n|r[\W_]*a[\W_]*g[\W_]*h[\W_]*e[\W_]*a[\W_]*d|t[\W_]*o[\W_]*w[\W_]*e[\W_]*l[\W_]*h[\W_]*e[\W_]*a[\W_]*d|r[\W_]*e[\W_]*t[\W_]*a[\W_]*r[\W_]*d)s?($|[^a-z])';
$$;
alter table public.chat_messages drop constraint if exists chat_messages_no_slurs;
alter table public.chat_messages add constraint chat_messages_no_slurs
  check (not public.satona_contains_slur(username) and not public.satona_contains_slur(content)) not valid;
