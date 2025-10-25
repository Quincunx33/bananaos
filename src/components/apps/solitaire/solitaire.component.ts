import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  suit: Suit;
  rank: Rank;
  isFaceUp: boolean;
  color: 'red' | 'black';
}

@Component({
  selector: 'app-solitaire',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './solitaire.component.html',
  styleUrls: ['./solitaire.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolitaireComponent {
  stock = signal<Card[]>([]);
  waste = signal<Card[]>([]);
  foundations = signal<Card[][]>([[], [], [], []]);
  tableau = signal<Card[][]>([[], [], [], [], [], [], []]);

  selectedCard = signal<{ pile: 'tableau' | 'waste' | 'foundation', pileIndex: number, cardIndex: number } | null>(null);
  isGameWon = computed(() => this.foundations().every(f => f.length === 13));

  constructor() {
    this.newGame();
  }

  newGame() {
    // Create a shuffled deck
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    let deck: Card[] = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit, rank, isFaceUp: false, color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black' });
      }
    }
    deck.sort(() => Math.random() - 0.5);

    // Deal to tableau
    const newTableau: Card[][] = [[], [], [], [], [], [], []];
    for (let i = 0; i < 7; i++) {
      for (let j = i; j < 7; j++) {
        newTableau[j].push(deck.pop()!);
      }
    }
    newTableau.forEach(pile => pile[pile.length - 1].isFaceUp = true);

    this.tableau.set(newTableau);
    this.stock.set(deck);
    this.waste.set([]);
    this.foundations.set([[], [], [], []]);
    this.selectedCard.set(null);
  }

  drawFromStock() {
    if (this.stock().length > 0) {
      this.stock.update(s => {
        const newWaste = s.pop()!;
        newWaste.isFaceUp = true;
        this.waste.update(w => [newWaste, ...w]);
        return s;
      });
    } else {
      // Return waste to stock
      this.stock.set(this.waste().reverse().map(c => ({...c, isFaceUp: false})));
      this.waste.set([]);
    }
  }

  handleCardClick(pile: 'tableau' | 'waste' | 'foundation', pileIndex: number, cardIndex: number) {
      const selection = this.selectedCard();
      const card = this.getCard(pile, pileIndex, cardIndex);

      if (!card || !card.isFaceUp) return;

      if (selection) {
          // Fix: A card cannot be moved to the waste pile. This check ensures we only attempt
          // valid moves to tableau or foundation piles, satisfying the type checker.
          if (pile !== 'waste') {
            this.moveCard(selection, { pile, pileIndex, cardIndex });
          }
          this.selectedCard.set(null);
      } else {
          this.selectedCard.set({ pile, pileIndex, cardIndex });
      }
  }

  handleEmptyPileClick(pile: 'tableau' | 'foundation', pileIndex: number) {
    const selection = this.selectedCard();
    if (selection) {
      this.moveCard(selection, { pile, pileIndex, cardIndex: -1 }); // -1 indicates empty pile
      this.selectedCard.set(null);
    }
  }

  private getCard(pile: 'tableau' | 'waste' | 'foundation', pileIndex: number, cardIndex: number): Card | null {
    if (pile === 'tableau') return this.tableau()[pileIndex][cardIndex];
    if (pile === 'waste') return this.waste()[cardIndex];
    if (pile === 'foundation') return this.foundations()[pileIndex][cardIndex];
    return null;
  }
  
  private moveCard(from: { pile: 'tableau' | 'waste' | 'foundation', pileIndex: number, cardIndex: number }, to: { pile: 'tableau' | 'foundation', pileIndex: number, cardIndex: number }) {
    const cardToMove = this.getCard(from.pile, from.pileIndex, from.cardIndex);
    if (!cardToMove) return;

    let cardsToMove: Card[] = [];
    if (from.pile === 'tableau') {
        cardsToMove = this.tableau()[from.pileIndex].slice(from.cardIndex);
    } else {
        cardsToMove = [cardToMove];
    }
    
    // Validate and execute move
    if (to.pile === 'foundation' && this.canMoveToFoundation(cardsToMove[0], to.pileIndex)) {
        this.executeMove(from, to, cardsToMove);
    } else if (to.pile === 'tableau' && this.canMoveToTableau(cardsToMove[0], to.pileIndex)) {
        this.executeMove(from, to, cardsToMove);
    }
  }

  private canMoveToFoundation(card: Card, foundationIndex: number): boolean {
    const foundation = this.foundations()[foundationIndex];
    const rankValues: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    if (foundation.length === 0) return card.rank === 'A';
    
    const topCard = foundation[foundation.length - 1];
    return card.suit === topCard.suit && rankValues.indexOf(card.rank) === rankValues.indexOf(topCard.rank) + 1;
  }

  private canMoveToTableau(card: Card, tableauIndex: number): boolean {
    const tableauPile = this.tableau()[tableauIndex];
    const rankValues: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    if (tableauPile.length === 0) return card.rank === 'K';

    const topCard = tableauPile[tableauPile.length - 1];
    return card.color !== topCard.color && rankValues.indexOf(card.rank) === rankValues.indexOf(topCard.rank) - 1;
  }

  private executeMove(from: { pile: 'tableau' | 'waste' | 'foundation', pileIndex: number, cardIndex: number }, to: { pile: 'tableau' | 'foundation', pileIndex: number, cardIndex: number }, cards: Card[]) {
      // Remove from source
      if (from.pile === 'waste') this.waste.update(w => w.slice(1));
      if (from.pile === 'foundation') this.foundations.update(f => { f[from.pileIndex].pop(); return [...f]; });
      if (from.pile === 'tableau') {
          this.tableau.update(t => {
              t[from.pileIndex] = t[from.pileIndex].slice(0, from.cardIndex);
              // Flip new top card
              if (t[from.pileIndex].length > 0) t[from.pileIndex][t[from.pileIndex].length - 1].isFaceUp = true;
              return [...t];
          });
      }
      
      // Add to destination
      if (to.pile === 'foundation') this.foundations.update(f => { f[to.pileIndex].push(cards[0]); return [...f]; });
      if (to.pile === 'tableau') this.tableau.update(t => { t[to.pileIndex].push(...cards); return [...t]; });
  }
}
