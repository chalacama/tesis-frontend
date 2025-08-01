export interface InformationResponse {
    userInformation: UserInformation;
}

export interface UserInformation {
    id:           number;
    birthdate:    Date;
    phone_number: string;
    province:     string;
    canton:       string;
    parish:       string;
    user_id:      number;
    created_at:   Date;
    updated_at:   Date;
}
export interface InformationRequest {
    birthdate:    Date | null;
    phone_number: string | null;
    province:     string | null;
    canton:       string | null;
    parish:       string | null;
}


