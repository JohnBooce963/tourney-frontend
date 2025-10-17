import { Injectable } from '@angular/core';
import { operator } from '../model/operator';
import { Squad } from '../model/squad';

@Injectable({
  providedIn: 'root'
})
export class CacheService {

  constructor() { }

  private operators: operator[] | null = null;
  private squads: Map<number, Squad[]> = new Map();

  setOperators(ops: operator[]) { 
    this.operators = ops; 
  }
  getOperators(): operator[] | null {
     return this.operators; 
    }

  setSquads(theme: number, squads: Squad[]) { 
    this.squads.set(theme, squads); 
  }
  getSquads(theme: number): Squad[] | null { 
    return this.squads.get(theme) || null; 
  }
}
