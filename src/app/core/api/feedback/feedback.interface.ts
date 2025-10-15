// feedback.interface.ts
export interface LikedRequest {
    liked: boolean;
}
export interface SavedRequest {
    saved: boolean;
}
export interface LikeResponse {
    ok: boolean;
    liked: boolean;

}
export interface SavedResponse {
    ok: boolean;
    saved: boolean;
    
}
export interface ContendRequest {
    second_seen : number
}
export interface ContendResponse {
    ok: boolean;
    second_seen: number
    updated_at: string;
}


