export interface LobbyResponse{
  id: string;
  name: string;
  theme: number;
  players: {
    1: string | null;
    2: string | null;
  }; 
  ownerToken: string;
}