import axios, { AxiosError } from 'axios';
import { GameState, HexCoord, ApiResponse } from './types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
});

function formatApiError(e: unknown, fallback: string): string {
  if (e instanceof AxiosError) {
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      return `请求超时，请检查后端服务（${fallback}）`;
    }
    if (!e.response) {
      return `无法连接后端服务（${fallback}）`;
    }
    const data = e.response.data as ApiResponse | undefined;
    if (data && typeof data.error === 'string') {
      return data.error;
    }
    if (e.response.status >= 500) {
      return `服务端错误（${fallback}）`;
    }
    if (e.response.status === 404) {
      return `资源不存在（${fallback}）`;
    }
  }
  if (e instanceof Error && e.message) {
    return e.message;
  }
  return fallback;
}

export async function createGame(level: number = 1, gridRadius?: number): Promise<GameState> {
  try {
    const response = await api.post<ApiResponse<GameState>>('/games', { level, gridRadius });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || '创建游戏失败');
    }
    return response.data.data;
  } catch (e) {
    throw new Error(formatApiError(e, '创建游戏失败'));
  }
}

export async function getGame(id: string): Promise<GameState> {
  try {
    const response = await api.get<ApiResponse<GameState>>(`/games/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || '加载游戏失败');
    }
    return response.data.data;
  } catch (e) {
    throw new Error(formatApiError(e, '加载游戏失败'));
  }
}

export async function extendMycelium(id: string, coord: HexCoord): Promise<GameState> {
  try {
    const response = await api.post<ApiResponse<GameState>>(`/games/${id}/extend`, { coord });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || '延伸菌丝失败');
    }
    return response.data.data;
  } catch (e) {
    throw new Error(formatApiError(e, '延伸菌丝失败'));
  }
}

export async function undoMove(id: string): Promise<GameState> {
  try {
    const response = await api.post<ApiResponse<GameState>>(`/games/${id}/undo`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || '撤销失败');
    }
    return response.data.data;
  } catch (e) {
    throw new Error(formatApiError(e, '撤销失败'));
  }
}

export async function resetGame(id: string): Promise<GameState> {
  try {
    const response = await api.post<ApiResponse<GameState>>(`/games/${id}/reset`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || '重置失败');
    }
    return response.data.data;
  } catch (e) {
    throw new Error(formatApiError(e, '重置失败'));
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await api.get('/health', { timeout: 3000 });
    return response.data?.status === 'ok';
  } catch {
    return false;
  }
}

export async function findPath(id: string, from: HexCoord, to: HexCoord): Promise<HexCoord[] | null> {
  try {
    const response = await api.post<ApiResponse<HexCoord[]>>(`/games/${id}/find-path`, { from, to });
    if (!response.data.success) return null;
    return response.data.data || null;
  } catch {
    return null;
  }
}
