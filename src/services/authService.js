import { supabase, supabaseAdmin } from '../config/supabase.js';
import { generateToken } from '../config/jwt.js';
import bcrypt from 'bcryptjs';

export const registerUser = async (email, password, name) => {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email,
          password: hashedPassword,
          name,
          role: 'user',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    // Get user from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  } catch (error) {
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, plan_id, created_at')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return user;
  } catch (error) {
    throw error;
  }
};
