import { operator } from "./operator";
import { Squad } from "./squad";

export interface PlayerAction{
    player: string | '';
    type: string | '';
    character: string | '';
    squad: string | '';
}