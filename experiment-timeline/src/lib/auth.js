import { supabase } from './supabaseClient';
import bcrypt from 'bcryptjs';

/**
 * 로그인 (username/password 방식)
 * Supabase Auth 대신 커스텀 사용자 테이블 사용
 */
export const login = async (username, password, rememberMe = false) => {
  try {
    console.log('로그인 시도:', { username, rememberMe });

    // 1. 사용자 조회
    const { data: user, error: userError } = await supabase
      .from('timeline_users')
      .select('*')
      .eq('username', username)
      .single();

    if (userError || !user) {
      console.error('사용자 조회 실패:', userError);
      throw new Error('사용자를 찾을 수 없습니다');
    }

    // 2. 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      console.error('비밀번호 불일치');
      throw new Error('비밀번호가 일치하지 않습니다');
    }

    // 3. 세션 저장 (LocalStorage)
    // 자동 로그인 시 30일, 아니면 24시간
    const expiryTime = rememberMe
      ? 30 * 24 * 60 * 60 * 1000  // 30일
      : 24 * 60 * 60 * 1000;      // 24시간

    const session = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token: user.id, // 간단하게 user id를 토큰으로 사용
      expiresAt: Date.now() + expiryTime,
      rememberMe
    };

    localStorage.setItem('timeline_session', JSON.stringify(session));

    console.log('로그인 성공:', { userId: user.id, role: user.role, expiryTime: expiryTime / (24 * 60 * 60 * 1000) + '일' });

    return { user: session.user, session };
  } catch (error) {
    console.error('로그인 오류:', error);
    throw error;
  }
};

/**
 * 로그아웃
 */
export const logout = () => {
  console.log('로그아웃');
  localStorage.removeItem('timeline_session');
  window.location.reload();
};

/**
 * 현재 세션 가져오기
 */
export const getSession = () => {
  try {
    const sessionStr = localStorage.getItem('timeline_session');
    if (!sessionStr) return null;

    const session = JSON.parse(sessionStr);

    // 만료 체크
    if (session.expiresAt < Date.now()) {
      console.log('세션 만료');
      localStorage.removeItem('timeline_session');
      return null;
    }

    return session;
  } catch (error) {
    console.error('세션 가져오기 오류:', error);
    return null;
  }
};

/**
 * 현재 사용자 가져오기
 */
export const getCurrentUser = () => {
  const session = getSession();
  return session?.user || null;
};

/**
 * 회원가입 (관리자만 가능)
 */
export const signUp = async (username, password, email, role = 'user') => {
  try {
    console.log('회원가입 시도:', { username, email, role });

    // 비밀번호 해싱
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 사용자 생성
    const { data, error } = await supabase
      .from('timeline_users')
      .insert([
        {
          username,
          password_hash: passwordHash,
          email,
          role
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('회원가입 오류:', error);
      throw new Error(error.message);
    }

    console.log('회원가입 성공:', { userId: data.id });

    return data;
  } catch (error) {
    console.error('회원가입 오류:', error);
    throw error;
  }
};

/**
 * 관리자 여부 확인
 */
export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};

/**
 * 비밀번호 변경
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('로그인이 필요합니다');
    }

    console.log('비밀번호 변경 시도:', { userId: user.id });

    // 1. 현재 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('timeline_users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('사용자 조회 실패:', userError);
      throw new Error('사용자 정보를 찾을 수 없습니다');
    }

    // 2. 현재 비밀번호 검증
    const isValidPassword = await bcrypt.compare(currentPassword, userData.password_hash);

    if (!isValidPassword) {
      console.error('현재 비밀번호 불일치');
      throw new Error('현재 비밀번호가 일치하지 않습니다');
    }

    // 3. 새 비밀번호 해싱
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // 4. 비밀번호 업데이트
    const { error: updateError } = await supabase
      .from('timeline_users')
      .update({ password_hash: newPasswordHash })
      .eq('id', user.id);

    if (updateError) {
      console.error('비밀번호 업데이트 실패:', updateError);
      throw new Error('비밀번호 변경에 실패했습니다');
    }

    console.log('비밀번호 변경 성공:', { userId: user.id });

    return { success: true };
  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    throw error;
  }
};
