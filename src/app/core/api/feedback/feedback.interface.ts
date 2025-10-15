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
