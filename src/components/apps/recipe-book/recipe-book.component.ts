import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Recipe {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  cookTime: string;
  servings: string;
  ingredients: string[];
  instructions: string[];
}

@Component({
  selector: 'app-recipe-book',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-book.component.html',
  styleUrls: ['./recipe-book.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeBookComponent {
  private allRecipes: Recipe[] = [
    {
      id: 1,
      title: 'Classic Tomato Pasta',
      description: 'A simple yet delicious pasta dish that is perfect for a weeknight dinner.',
      imageUrl: 'https://picsum.photos/id/1060/400/300',
      cookTime: '30 mins',
      servings: '4',
      ingredients: [
        '1 lb spaghetti',
        '2 tbsp olive oil',
        '3 cloves garlic, minced',
        '1 (28-ounce) can crushed tomatoes',
        '1 tsp dried oregano',
        'Salt and pepper to taste',
        'Fresh basil for garnish'
      ],
      instructions: [
        'Cook spaghetti according to package directions. Drain and set aside.',
        'In a large skillet, heat olive oil over medium heat. Add garlic and cook until fragrant, about 1 minute.',
        'Stir in crushed tomatoes, oregano, salt, and pepper. Bring to a simmer and cook for 15 minutes, stirring occasionally.',
        'Add the cooked spaghetti to the sauce and toss to coat.',
        'Serve immediately, garnished with fresh basil.'
      ]
    },
    {
      id: 2,
      title: 'Avocado Toast with Egg',
      description: 'A healthy and satisfying breakfast that comes together in minutes.',
      imageUrl: 'https://picsum.photos/id/292/400/300',
      cookTime: '10 mins',
      servings: '1',
      ingredients: [
        '1 slice of whole-wheat bread, toasted',
        '1/2 ripe avocado',
        '1 large egg',
        '1 tsp lemon juice',
        'Red pepper flakes, salt, and pepper to taste'
      ],
      instructions: [
        'In a small bowl, mash the avocado with lemon juice, salt, and pepper.',
        'Cook the egg to your liking (fried, poached, or scrambled).',
        'Spread the mashed avocado on the toast.',
        'Top with the cooked egg.',
        'Sprinkle with red pepper flakes and serve immediately.'
      ]
    },
    {
      id: 3,
      title: 'Chocolate Chip Cookies',
      description: 'The ultimate classic chocolate chip cookie recipe - soft, chewy, and delicious.',
      imageUrl: 'https://picsum.photos/id/312/400/300',
      cookTime: '25 mins',
      servings: '24 cookies',
      ingredients: [
        '2 1/4 cups all-purpose flour',
        '1 tsp baking soda',
        '1/2 tsp salt',
        '1 cup (2 sticks) unsalted butter, softened',
        '3/4 cup granulated sugar',
        '3/4 cup packed brown sugar',
        '1 tsp vanilla extract',
        '2 large eggs',
        '2 cups semi-sweet chocolate chips'
      ],
      instructions: [
        'Preheat oven to 375°F (190°C).',
        'In a small bowl, whisk together flour, baking soda, and salt.',
        'In a large bowl, beat butter, granulated sugar, brown sugar, and vanilla extract until creamy.',
        'Add eggs, one at a time, beating well after each addition.',
        'Gradually beat in flour mixture.',
        'Stir in chocolate chips.',
        'Drop by rounded tablespoonfuls onto ungreased baking sheets.',
        'Bake for 9 to 11 minutes or until golden brown. Cool on baking sheets for 2 minutes; remove to wire racks to cool completely.'
      ]
    },
    {
        id: 4,
        title: 'Grilled Lemon Herb Chicken',
        description: 'A juicy and flavorful chicken recipe perfect for grilling season.',
        imageUrl: 'https://picsum.photos/id/431/400/300',
        cookTime: '45 mins',
        servings: '4',
        ingredients: [
          '4 boneless, skinless chicken breasts',
          '1/4 cup olive oil',
          '1/4 cup fresh lemon juice',
          '2 cloves garlic, minced',
          '1 tbsp fresh rosemary, chopped',
          '1 tbsp fresh thyme, chopped',
          'Salt and freshly ground black pepper'
        ],
        instructions: [
          'In a bowl, whisk together olive oil, lemon juice, garlic, rosemary, thyme, salt, and pepper.',
          'Place chicken in a resealable plastic bag or shallow dish. Pour marinade over, and turn to coat. Marinate for at least 30 minutes.',
          'Preheat grill to medium-high heat.',
          'Grill chicken for 6-8 minutes per side, or until cooked through.',
          'Let rest for 5 minutes before serving.'
        ]
      }
  ];

  selectedRecipe = signal<Recipe | null>(null);
  searchQuery = signal('');
  
  filteredRecipes = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.allRecipes;
    return this.allRecipes.filter(recipe => recipe.title.toLowerCase().includes(query) || recipe.description.toLowerCase().includes(query));
  });

  selectRecipe(recipe: Recipe) {
    this.selectedRecipe.set(recipe);
  }
  
  handleSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }
}
