-- Fix chat_messages foreign key to profiles table
ALTER TABLE chat_messages 
DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey,
DROP CONSTRAINT IF EXISTS chat_messages_receiver_id_fkey;

ALTER TABLE chat_messages
ADD CONSTRAINT chat_messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT chat_messages_receiver_id_fkey 
  FOREIGN KEY (receiver_id) REFERENCES profiles(id) ON DELETE CASCADE;