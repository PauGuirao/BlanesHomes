// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ftxgkubrssoysnfiqgsa.supabase.co'; // pon aquí tu URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0eGdrdWJyc3NveXNuZmlxZ3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNzgyOTIsImV4cCI6MjA2MDY1NDI5Mn0.9JaYEGW7nhihSDCbTBKNVKJu6hgTmVJv71b_9YaIHaY'; // pon aquí tu anon key
export const supabase = createClient(supabaseUrl, supabaseKey);
