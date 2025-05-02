export interface Meal {
  id: string;
  name: string;
  category: MealCategory;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingSizeGrams: number;
  defaultServings: number;
  image?: string;
  ingredients: string[];
  recipe: string[];
}

export type MealCategory = 
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'dessert'
  | 'drink';

// Pre-defined meal database with nutritional information and recipes
export const MEALS_DATABASE: Meal[] = [
  {
    id: 'scrambled-eggs',
    name: 'Scrambled Eggs',
    category: 'breakfast',
    caloriesPer100g: 143,
    proteinPer100g: 13.5,
    carbsPer100g: 1.1,
    fatPer100g: 9.7,
    servingSizeGrams: 150,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '3 large eggs',
      '2 tbsp milk',
      '1 tbsp butter',
      'Salt and pepper to taste'
    ],
    recipe: [
      'Whisk eggs and milk together in a bowl.',
      'Melt butter in a non-stick pan over medium-low heat.',
      'Pour in egg mixture and let it sit for about 30 seconds.',
      'With a spatula, gently pull the eggs across the pan to form large curds.',
      'Continue pulling and folding eggs until no liquid remains.',
      'Remove from heat while eggs are still slightly wet (they will continue cooking).',
      'Season with salt and pepper.'
    ]
  },
  {
    id: 'oatmeal',
    name: 'Oatmeal with Fruit',
    category: 'breakfast',
    caloriesPer100g: 68,
    proteinPer100g: 2.5,
    carbsPer100g: 12,
    fatPer100g: 1.3,
    servingSizeGrams: 250,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '1/2 cup rolled oats',
      '1 cup water or milk',
      '1 tbsp honey or maple syrup',
      '1/4 cup mixed berries',
      '1 tbsp chopped nuts'
    ],
    recipe: [
      'Combine oats and liquid in a saucepan.',
      'Bring to a boil, then reduce heat to low.',
      'Simmer for 5 minutes, stirring occasionally.',
      'Remove from heat and let stand for 2 minutes.',
      'Top with berries, nuts, and sweetener.'
    ]
  },
  {
    id: 'grilled-chicken-salad',
    name: 'Grilled Chicken Salad',
    category: 'lunch',
    caloriesPer100g: 124,
    proteinPer100g: 18,
    carbsPer100g: 5,
    fatPer100g: 3.2,
    servingSizeGrams: 350,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '1 chicken breast (6oz)',
      '2 cups mixed greens',
      '1/4 cup cherry tomatoes',
      '1/4 cucumber, sliced',
      '2 tbsp olive oil',
      '1 tbsp balsamic vinegar',
      'Salt and pepper to taste'
    ],
    recipe: [
      'Season chicken breast with salt and pepper.',
      'Grill chicken for 6-7 minutes per side until internal temperature reaches 165°F (74°C).',
      'Let chicken rest for 5 minutes, then slice.',
      'In a large bowl, combine greens, tomatoes, and cucumber.',
      'Whisk together olive oil and balsamic vinegar for dressing.',
      'Top salad with sliced chicken and drizzle with dressing.'
    ]
  },
  {
    id: 'avocado-toast',
    name: 'Avocado Toast',
    category: 'breakfast',
    caloriesPer100g: 220,
    proteinPer100g: 5,
    carbsPer100g: 20,
    fatPer100g: 15,
    servingSizeGrams: 150,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '1 slice whole grain bread',
      '1/2 ripe avocado',
      '1 tsp lemon juice',
      'Pinch of red pepper flakes',
      'Salt and pepper to taste',
      '1 egg (optional)'
    ],
    recipe: [
      'Toast bread until golden and crisp.',
      'Mash avocado with lemon juice, salt, and pepper.',
      'Spread avocado mixture on toast.',
      'Top with red pepper flakes.',
      'Optional: Top with a poached or fried egg.'
    ]
  },
  {
    id: 'chicken-wrap',
    name: 'Grilled Chicken Wrap',
    category: 'lunch',
    caloriesPer100g: 180,
    proteinPer100g: 16,
    carbsPer100g: 22,
    fatPer100g: 5,
    servingSizeGrams: 250,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '1 whole wheat tortilla',
      '4 oz grilled chicken breast, sliced',
      '1/4 cup shredded lettuce',
      '1/4 cup diced tomatoes',
      '2 tbsp Greek yogurt or hummus',
      '1 tbsp feta cheese (optional)'
    ],
    recipe: [
      'Spread yogurt or hummus on tortilla.',
      'Layer with chicken, lettuce, tomatoes, and feta.',
      'Roll up tightly, tucking in the sides.',
      'Cut in half diagonally and serve.'
    ]
  },
  {
    id: 'beef-stir-fry',
    name: 'Beef and Broccoli Stir Fry',
    category: 'dinner',
    caloriesPer100g: 150,
    proteinPer100g: 18,
    carbsPer100g: 10,
    fatPer100g: 5,
    servingSizeGrams: 400,
    defaultServings: 2,
    image: 'https://images.unsplash.com/photo-1604917019117-282197ada94b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '8 oz flank steak, thinly sliced',
      '2 cups broccoli florets',
      '1 red bell pepper, sliced',
      '2 tbsp soy sauce',
      '1 tbsp honey',
      '1 tbsp sesame oil',
      '2 cloves garlic, minced',
      '1 tsp ginger, grated',
      '1 tbsp sesame seeds'
    ],
    recipe: [
      'Mix soy sauce, honey, garlic, and ginger in a bowl.',
      'Marinate beef in half the sauce for 15 minutes.',
      'Heat oil in a wok or large pan over high heat.',
      'Stir-fry beef for 2-3 minutes, then remove.',
      'Add vegetables and stir-fry for 3-4 minutes.',
      'Return beef to pan, add remaining sauce, and cook for 1 more minute.',
      'Garnish with sesame seeds.'
    ]
  },
  {
    id: 'trail-mix',
    name: 'Homemade Trail Mix',
    category: 'snack',
    caloriesPer100g: 480,
    proteinPer100g: 12,
    carbsPer100g: 40,
    fatPer100g: 32,
    servingSizeGrams: 50,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd5130209?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '1/4 cup raw almonds',
      '1/4 cup walnuts',
      '2 tbsp pumpkin seeds',
      '2 tbsp dried cranberries',
      '1 tbsp dark chocolate chips'
    ],
    recipe: [
      'Combine all ingredients in a bowl.',
      'Mix well and store in an airtight container.',
      'Portion into small bags for easy snacking.'
    ]
  },
  {
    id: 'chia-pudding',
    name: 'Chia Seed Pudding',
    category: 'dessert',
    caloriesPer100g: 120,
    proteinPer100g: 4,
    carbsPer100g: 15,
    fatPer100g: 6,
    servingSizeGrams: 200,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '3 tbsp chia seeds',
      '1 cup almond milk',
      '1 tsp vanilla extract',
      '1 tbsp maple syrup',
      '1/4 cup mixed berries'
    ],
    recipe: [
      'Whisk together chia seeds, almond milk, vanilla, and maple syrup.',
      'Let sit for 5 minutes, then whisk again.',
      'Cover and refrigerate for at least 2 hours or overnight.',
      'Top with berries before serving.'
    ]
  },
  {
    id: 'iced-coffee',
    name: 'Iced Coffee with Milk',
    category: 'drink',
    caloriesPer100g: 15,
    proteinPer100g: 1,
    carbsPer100g: 2,
    fatPer100g: 0.5,
    servingSizeGrams: 300,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '1 cup brewed coffee, cooled',
      '1/2 cup milk or plant-based milk',
      'Ice cubes',
      '1 tsp sugar or sweetener (optional)'
    ],
    recipe: [
      'Brew coffee and let cool to room temperature.',
      'Fill a glass with ice cubes.',
      'Pour coffee over ice.',
      'Add milk and sweetener if desired.',
      'Stir well and serve.'
    ]
  },
  {
    id: 'turkey-burger',
    name: 'Turkey Burger with Sweet Potato Fries',
    category: 'dinner',
    caloriesPer100g: 210,
    proteinPer100g: 22,
    carbsPer100g: 25,
    fatPer100g: 5,
    servingSizeGrams: 450,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1561758033-7e924f619b47?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '1 turkey burger patty (4oz)',
      '1 whole wheat bun',
      '1 slice cheddar cheese',
      '1/4 avocado, sliced',
      '1 small sweet potato, cut into fries',
      '1 tbsp olive oil',
      'Salt and pepper to taste'
    ],
    recipe: [
      'Preheat oven to 425°F (220°C).',
      'Toss sweet potato fries with olive oil, salt, and pepper.',
      'Roast for 20-25 minutes, flipping halfway.',
      'Cook turkey burger in a pan or grill for 5-6 minutes per side.',
      'Add cheese during last minute of cooking.',
      'Serve burger on bun with avocado and sweet potato fries.'
    ]
  },
  {
    id: 'quinoa-bowl',
    name: 'Quinoa & Vegetable Bowl',
    category: 'lunch',
    caloriesPer100g: 120,
    proteinPer100g: 4.4,
    carbsPer100g: 21,
    fatPer100g: 1.9,
    servingSizeGrams: 300,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '1/2 cup quinoa',
      '1 cup water',
      '1 cup roasted vegetables (bell peppers, zucchini, broccoli)',
      '1/4 avocado, sliced',
      '2 tbsp hummus',
      '1 tbsp olive oil',
      'Juice of 1/2 lemon',
      'Salt and pepper to taste'
    ],
    recipe: [
      'Rinse quinoa under cold water.',
      'In a saucepan, combine quinoa and water. Bring to a boil.',
      'Reduce heat to low, cover, and simmer for 15 minutes.',
      'Remove from heat and let stand for 5 minutes, then fluff with a fork.',
      'Toss vegetables with olive oil, salt, and pepper.',
      'Roast vegetables at 425°F (220°C) for 20 minutes.',
      'Combine quinoa and roasted vegetables in a bowl.',
      'Top with avocado slices and hummus.',
      'Drizzle with lemon juice and serve.'
    ]
  },
  {
    id: 'salmon-dinner',
    name: 'Baked Salmon with Roasted Vegetables',
    category: 'dinner',
    caloriesPer100g: 208,
    proteinPer100g: 20,
    carbsPer100g: 10,
    fatPer100g: 12,
    servingSizeGrams: 400,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '6 oz salmon fillet',
      '2 cups mixed vegetables (broccoli, carrots, bell peppers)',
      '2 tbsp olive oil',
      '1 lemon',
      '2 cloves garlic, minced',
      'Fresh herbs (dill, parsley)',
      'Salt and pepper to taste'
    ],
    recipe: [
      'Preheat oven to 400°F (200°C).',
      'Place salmon on a baking sheet lined with parchment paper.',
      'Season salmon with salt, pepper, and minced garlic.',
      'Squeeze half a lemon over the salmon and top with fresh herbs.',
      'Toss vegetables with olive oil, salt, and pepper.',
      'Spread vegetables on another baking sheet.',
      'Bake salmon for 12-15 minutes until it flakes easily with a fork.',
      'Roast vegetables for 20-25 minutes until tender.',
      'Serve salmon with roasted vegetables and lemon wedges.'
    ]
  },
  {
    id: 'pasta-primavera',
    name: 'Pasta Primavera',
    category: 'dinner',
    caloriesPer100g: 157,
    proteinPer100g: 5.7,
    carbsPer100g: 27,
    fatPer100g: 3.2,
    servingSizeGrams: 350,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '2 oz whole grain pasta',
      '1 cup mixed vegetables (zucchini, bell peppers, cherry tomatoes)',
      '2 tbsp olive oil',
      '2 cloves garlic, minced',
      '1/4 cup grated Parmesan cheese',
      'Fresh basil leaves',
      'Red pepper flakes (optional)',
      'Salt and pepper to taste'
    ],
    recipe: [
      'Cook pasta according to package instructions until al dente.',
      'While pasta is cooking, heat olive oil in a large pan over medium heat.',
      'Add garlic and cook until fragrant, about 30 seconds.',
      'Add vegetables and cook until tender-crisp, about 5-7 minutes.',
      'Drain pasta, reserving 1/4 cup of pasta water.',
      'Add pasta to the pan with vegetables.',
      'Add reserved pasta water and toss to combine.',
      'Remove from heat and stir in grated Parmesan cheese.',
      'Season with salt, pepper, and red pepper flakes if desired.',
      'Garnish with fresh basil leaves before serving.'
    ]
  },
  {
    id: 'greek-yogurt-parfait',
    name: 'Greek Yogurt Parfait',
    category: 'snack',
    caloriesPer100g: 94,
    proteinPer100g: 10,
    carbsPer100g: 7.6,
    fatPer100g: 2.5,
    servingSizeGrams: 200,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1488477304112-4944851de03d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '1 cup Greek yogurt',
      '1/4 cup mixed berries',
      '1 tbsp honey',
      '2 tbsp granola'
    ],
    recipe: [
      'Place half of the yogurt in a glass or bowl.',
      'Top with half of the berries and granola.',
      'Add the remaining yogurt.',
      'Top with remaining berries and granola.',
      'Drizzle with honey before serving.'
    ]
  },
  {
    id: 'hummus-veggie-sticks',
    name: 'Hummus with Vegetable Sticks',
    category: 'snack',
    caloriesPer100g: 166,
    proteinPer100g: 7.9,
    carbsPer100g: 14,
    fatPer100g: 9.6,
    servingSizeGrams: 150,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1527731149372-fae504a1185f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '1/2 cup hummus',
      '1 cup mixed vegetable sticks (carrots, celery, bell peppers)',
      'Pinch of paprika',
      'Drizzle of olive oil'
    ],
    recipe: [
      'Prepare vegetable sticks by washing and cutting them into even pieces.',
      'Place hummus in a small bowl.',
      'Drizzle with olive oil and sprinkle with paprika.',
      'Serve with vegetable sticks for dipping.'
    ]
  },
  {
    id: 'fruit-salad',
    name: 'Fresh Fruit Salad',
    category: 'dessert',
    caloriesPer100g: 50,
    proteinPer100g: 0.7,
    carbsPer100g: 13,
    fatPer100g: 0.2,
    servingSizeGrams: 250,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '1/2 cup strawberries, halved',
      '1/2 cup blueberries',
      '1 banana, sliced',
      '1 kiwi, peeled and sliced',
      '1 tbsp honey',
      '1 tbsp lemon juice',
      'Fresh mint leaves for garnish'
    ],
    recipe: [
      'Combine all fruit in a bowl.',
      'Mix honey and lemon juice together in a small bowl.',
      'Drizzle the honey mixture over the fruit.',
      'Gently toss to coat.',
      'Garnish with fresh mint leaves.'
    ]
  },
  {
    id: 'dark-chocolate',
    name: 'Dark Chocolate (70% cacao)',
    category: 'dessert',
    caloriesPer100g: 598,
    proteinPer100g: 7.8,
    carbsPer100g: 46,
    fatPer100g: 43,
    servingSizeGrams: 30,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1526081347589-7fa3cb41b4b2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '1 oz dark chocolate (70% cacao or higher)'
    ],
    recipe: [
      'Break into pieces and enjoy in moderation.',
      'Pair with fresh berries for an antioxidant-rich dessert.'
    ]
  },
  {
    id: 'green-smoothie',
    name: 'Green Smoothie',
    category: 'drink',
    caloriesPer100g: 56,
    proteinPer100g: 1.5,
    carbsPer100g: 12,
    fatPer100g: 0.5,
    servingSizeGrams: 300,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '1 cup spinach',
      '1 small banana',
      '1/2 cup pineapple chunks',
      '1 cup almond milk',
      '1 tbsp chia seeds',
      'Ice cubes'
    ],
    recipe: [
      'Add all ingredients to a blender.',
      'Blend on high speed until smooth and creamy.',
      'Adjust consistency with more almond milk if desired.',
      'Pour into a glass and serve immediately.'
    ]
  },
  {
    id: 'protein-shake',
    name: 'Protein Shake',
    category: 'drink',
    caloriesPer100g: 115,
    proteinPer100g: 15,
    carbsPer100g: 12,
    fatPer100g: 1.8,
    servingSizeGrams: 300,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1506805629250-320593917a1f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '1 scoop (25g) protein powder',
      '1 cup milk or plant-based alternative',
      '1/2 banana',
      '1 tbsp peanut butter',
      '1/2 cup ice',
      '1/2 tsp cinnamon (optional)'
    ],
    recipe: [
      'Add all ingredients to a blender.',
      'Blend on high speed until smooth and creamy, about 30-60 seconds.',
      'Pour into a glass and consume within 20 minutes after workout for optimal benefits.'
    ]
  },
  {
    id: 'breakfast-burrito',
    name: 'Breakfast Burrito',
    category: 'breakfast',
    caloriesPer100g: 210,
    proteinPer100g: 12,
    carbsPer100g: 22,
    fatPer100g: 8,
    servingSizeGrams: 250,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '1 whole wheat tortilla',
      '2 eggs, scrambled',
      '1/4 cup black beans',
      '2 tbsp salsa',
      '1/4 avocado, sliced',
      '1 tbsp Greek yogurt (sub for sour cream)'
    ],
    recipe: [
      'Scramble eggs in a non-stick pan.',
      'Warm tortilla and layer with eggs, beans, salsa, and avocado.',
      'Drizzle with Greek yogurt.',
      'Roll tightly and serve.'
    ]
  },
  {
    id: 'miso-soup',
    name: 'Miso Soup with Tofu',
    category: 'lunch',
    caloriesPer100g: 50,
    proteinPer100g: 4,
    carbsPer100g: 5,
    fatPer100g: 2,
    servingSizeGrams: 300,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '2 cups dashi broth',
      '2 tbsp miso paste',
      '1/4 cup silken tofu, cubed',
      '1 tbsp seaweed (wakame)',
      '1 green onion, sliced'
    ],
    recipe: [
      'Heat broth until simmering (do not boil).',
      'Dissolve miso paste in a ladle of broth, then return to pot.',
      'Add tofu and seaweed.',
      'Garnish with green onions.'
    ]
  },
  {
    id: 'mushroom-risotto',
    name: 'Creamy Mushroom Risotto',
    category: 'dinner',
    caloriesPer100g: 180,
    proteinPer100g: 5,
    carbsPer100g: 28,
    fatPer100g: 6,
    servingSizeGrams: 350,
    defaultServings: 2,
    image: 'https://images.unsplash.com/photo-1635805737707-2af5f8d18c1a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '1 cup Arborio rice',
      '3 cups vegetable broth',
      '1 cup mushrooms, sliced',
      '1/4 cup white wine',
      '2 tbsp Parmesan cheese',
      '1 tbsp butter',
      '1 shallot, diced'
    ],
    recipe: [
      'Sauté shallots and mushrooms in butter.',
      'Add rice and toast for 1 minute.',
      'Deglaze with wine, then add broth 1/2 cup at a time, stirring until absorbed.',
      'Stir in Parmesan before serving.'
    ]
  },
  {
    id: 'edamame',
    name: 'Steamed Edamame with Sea Salt',
    category: 'snack',
    caloriesPer100g: 120,
    proteinPer100g: 11,
    carbsPer100g: 9,
    fatPer100g: 5,
    servingSizeGrams: 100,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1604977047416-8b70a5d0e5d6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '1 cup edamame in pods',
      '1/2 tsp sea salt',
      '1/2 tsp chili flakes (optional)'
    ],
    recipe: [
      'Steam edamame for 5 minutes.',
      'Toss with salt and chili flakes.',
      'Serve warm.'
    ]
  },
  {
    id: 'apple-crisp',
    name: 'Baked Apple Crisp',
    category: 'dessert',
    caloriesPer100g: 150,
    proteinPer100g: 2,
    carbsPer100g: 30,
    fatPer100g: 4,
    servingSizeGrams: 200,
    defaultServings: 4,
    image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '4 apples, sliced',
      '1/2 cup oats',
      '2 tbsp honey',
      '1 tsp cinnamon',
      '1 tbsp butter, melted'
    ],
    recipe: [
      'Preheat oven to 350°F (175°C).',
      'Layer apples in a baking dish.',
      'Mix oats, honey, cinnamon, and butter into a crumble.',
      'Sprinkle over apples and bake for 30 minutes.'
    ]
  },
  {
    id: 'turmeric-latte',
    name: 'Golden Turmeric Latte',
    category: 'drink',
    caloriesPer100g: 60,
    proteinPer100g: 2,
    carbsPer100g: 8,
    fatPer100g: 3,
    servingSizeGrams: 250,
    defaultServings: 1,
    image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    ingredients: [
      '1 cup almond milk',
      '1/2 tsp turmeric',
      '1/4 tsp cinnamon',
      '1 tsp honey',
      'Pinch of black pepper'
    ],
    recipe: [
      'Heat milk gently in a saucepan.',
      'Whisk in spices and honey.',
      'Simmer for 2 minutes.',
      'Strain and serve warm.'
    ]
  }
];

// Function to calculate nutrition based on portion size
export const calculateNutrition = (meal: Meal, grams: number) => {
  const factor = grams / 100; // Calculate as a factor of 100g
  
  return {
    calories: Math.round(meal.caloriesPer100g * factor),
    protein: parseFloat((meal.proteinPer100g * factor).toFixed(1)),
    carbs: parseFloat((meal.carbsPer100g * factor).toFixed(1)),
    fat: parseFloat((meal.fatPer100g * factor).toFixed(1)),
  };
};

// Function to get meals by category
export const getMealsByCategory = (category: MealCategory): Meal[] => {
  return MEALS_DATABASE.filter(meal => meal.category === category);
};

// Function to get all available meal categories
export const getMealCategories = (): MealCategory[] => {
  return ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'drink'];
};

// Function to search meals by name
export const searchMealsByName = (query: string): Meal[] => {
  const lowerCaseQuery = query.toLowerCase();
  return MEALS_DATABASE.filter(meal => 
    meal.name.toLowerCase().includes(lowerCaseQuery)
  );
};

// Function to get meal by ID
export const getMealById = (id: string): Meal | undefined => {
  return MEALS_DATABASE.find(meal => meal.id === id);
};