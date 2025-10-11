export interface LobbyResponse{
  id: string;
  name: string;
  theme: number;
  players: {
    0: string | null;
    1: string | null;
  }; 
  ownerToken: string;
}