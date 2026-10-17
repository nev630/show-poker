// firebase-config.js - Firebase 초기화 및 Realtime Database 연결 관리

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  update, 
  push, 
  onValue, 
  off, 
  runTransaction, 
  onDisconnect,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// 기본 제공 Firebase 설정 (사용자 프로젝트: show-poker)
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCdnZiQzjAI5V2kIOcH-KUiHuDAryD4os8",
  authDomain: "show-poker.firebaseapp.com",
  databaseURL: "https://show-poker-default-rtdb.firebaseio.com",
  projectId: "show-poker",
  storageBucket: "show-poker.firebasestorage.app",
  messagingSenderId: "887826354174",
  appId: "1:887826354174:web:488c09631a8da6535cbaaf"
};

// 기본 저장된 설정 불러오기
const DEFAULT_CONFIG_STORAGE_KEY = 'muryeok_poker_firebase_config';

export function getStoredFirebaseConfig() {
  try {
    const raw = localStorage.getItem(DEFAULT_CONFIG_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored Firebase config', e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config) {
  localStorage.setItem(DEFAULT_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function clearFirebaseConfig() {
  localStorage.removeItem(DEFAULT_CONFIG_STORAGE_KEY);
}

class FirebaseService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.currentUser = null;
    this.isInitialized = false;
    this.isDemoMode = false;
  }

  /**
   * Firebase 초기화
   * @param {Object} customConfig - 사용자가 입력한 Firebase 설정 객체
   */
  async init(customConfig = null) {
    const config = customConfig || getStoredFirebaseConfig();

    if (!config || !config.apiKey || !config.databaseURL) {
      console.warn('Firebase 설정이 없습니다. 데모/설정 대기 모드로 동작합니다.');
      this.isInitialized = false;
      this.isDemoMode = true;
      return false;
    }

    try {
      this.app = initializeApp(config);
      this.auth = getAuth(this.app);
      this.db = getDatabase(this.app);

      // 익명 로그인 수행 (보안 규칙의 auth.uid 기반 제어 지원)
      await new Promise((resolve, reject) => {
        onAuthStateChanged(this.auth, (user) => {
          if (user) {
            this.currentUser = user;
            resolve(user);
          }
        });
        signInAnonymously(this.auth).catch(reject);
      });

      this.isInitialized = true;
      this.isDemoMode = false;
      console.log('Firebase 및 익명 인증 초기화 성공:', this.currentUser.uid);
      return true;
    } catch (err) {
      console.error('Firebase 초기화 오류:', err);
      this.isInitialized = false;
      throw err;
    }
  }

  getUid() {
    // 탭/세션별 고유 UID를 생성하여 동일 브라우저 다중 탭 테스트 시 호스트/참가자 충돌 완전 방지
    let sessionTabId = sessionStorage.getItem('muryeok_tab_uid');
    if (!sessionTabId) {
      const base = this.currentUser ? this.currentUser.uid.substring(0, 10) : 'user';
      sessionTabId = `${base}_${Math.random().toString(36).substring(2, 8)}`;
      sessionStorage.setItem('muryeok_tab_uid', sessionTabId);
    }
    return sessionTabId;
  }
}

export const fb = new FirebaseService();
export {
  ref,
  set,
  get,
  update,
  push,
  onValue,
  off,
  runTransaction,
  onDisconnect,
  serverTimestamp
};
