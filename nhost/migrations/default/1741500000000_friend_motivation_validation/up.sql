CREATE OR REPLACE FUNCTION public.validate_friend_motivation_friends()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.sender_id = NEW.recipient_id THEN
    RAISE EXCEPTION 'Cannot send motivation to yourself';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.friendships f
    WHERE f.status = 'accepted'
      AND (
        (f.requester_id = NEW.sender_id AND f.addressee_id = NEW.recipient_id)
        OR (f.addressee_id = NEW.sender_id AND f.requester_id = NEW.recipient_id)
      )
  ) THEN
    RAISE EXCEPTION 'You must be friends with the recipient';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS friend_motivations_validate_friends ON public.friend_motivations;

CREATE TRIGGER friend_motivations_validate_friends
  BEFORE INSERT ON public.friend_motivations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_friend_motivation_friends();
