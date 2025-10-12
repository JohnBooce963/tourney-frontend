export interface LobbyResponse{
  id: string;
  name: string;
  theme: number;
  players: {
    [key: number]: string | null;  // ✅ allows lobby.players[0], lobby.players[1]
  };
  ownerToken: string;
}