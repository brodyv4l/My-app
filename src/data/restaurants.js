const CHAIN_COLORS = {
  mcdonalds: '#FFC72C',
  burgerking: '#EC1C24',
  wendys: '#E31837',
  chickfila: '#DD0031',
  tacobell: '#702082',
  chipotle: '#A81612',
  subway: '#009639',
  panera: '#6B8E23',
  starbucks: '#00704A',
  kfc: '#E4002B',
  pizzahut: '#EE3124',
  dominos: '#006491',
  popeyes: '#D4AF37',
  shakeshack: '#63B446',
  fiveguys: '#D32323',
  pandaexpress: '#E31837',
  sonic: '#FF6600',
  dairyqueen: '#EE2E24',
  wingstop: '#FFC72C',
  buffalowildwings: '#FFC72C',
  innout: '#FFC72C',
  whataburger: '#F7941D',
  jackinthebox: '#E31837',
};

export const RESTAURANT_DATA = [
  // McDONALD'S
  { id: 'mc1', restaurant: "McDonald's", restaurantId: 'mcdonalds', category: 'Burgers', name: 'Big Mac', serving: '1 sandwich (214g)', calories: 590, protein: 25, carbs: 46, fat: 34, saturatedFat: 11, sodium: 1010, fiber: 3, sugar: 9 },
  { id: 'mc2', restaurant: "McDonald's", restaurantId: 'mcdonalds', category: 'Burgers', name: 'Quarter Pounder with Cheese', serving: '1 sandwich (226g)', calories: 740, protein: 48, carbs: 40, fat: 42, saturatedFat: 19, sodium: 1120, fiber: 2, sugar: 10 },
  { id: 'mc3', restaurant: "McDonald's", restaurantId: 'mcdonalds', category: 'Burgers', name: 'McDouble', serving: '1 sandwich (176g)', calories: 400, protein: 25, carbs: 32, fat: 20, saturatedFat: 8, sodium: 830, fiber: 1, sugar: 7 },
  { id: 'mc4', restaurant: "McDonald's", restaurantId: 'mcdonalds', category: 'Chicken', name: 'McChicken', serving: '1 sandwich (161g)', calories: 400, protein: 14, carbs: 41, fat: 21, saturatedFat: 3.5, sodium: 590, fiber: 2, sugar: 5 },
  { id: 'mc5', restaurant: "McDonald's", restaurantId: 'mcdonalds', category: 'Chicken', name: '10 Piece McNuggets', serving: '10 pieces (162g)', calories: 400, protein: 24, carbs: 24, fat: 24, saturatedFat: 4, sodium: 680, fiber: 1, sugar: 0 },
  { id: 'mc6', restaurant: "McDonald's", restaurantId: 'mcdonalds', category: 'Breakfast', name: 'Egg McMuffin', serving: '1 sandwich (138g)', calories: 310, protein: 17, carbs: 30, fat: 13, saturatedFat: 5, sodium: 760, fiber: 2, sugar: 3 },
  { id: 'mc7', restaurant: "McDonald's", restaurantId: 'mcdonalds', category: 'Breakfast', name: 'Sausage Burrito', serving: '1 burrito (114g)', calories: 300, protein: 13, carbs: 26, fat: 17, saturatedFat: 6, sodium: 600, fiber: 1, sugar: 2 },
  { id: 'mc8', restaurant: "McDonald's", restaurantId: 'mcdonalds', category: 'Sides', name: 'Medium French Fries', serving: '1 medium (117g)', calories: 320, protein: 4, carbs: 44, fat: 15, saturatedFat: 2, sodium: 400, fiber: 4, sugar: 0 },
  { id: 'mc9', restaurant: "McDonald's", restaurantId: 'mcdonalds', category: 'Sides', name: 'Large French Fries', serving: '1 large (154g)', calories: 490, protein: 7, carbs: 66, fat: 23, saturatedFat: 3, sodium: 400, fiber: 6, sugar: 0 },
  { id: 'mc10', restaurant: "McDonald's", restaurantId: 'mcdonalds', category: 'Desserts', name: 'McFlurry Oreo', serving: '1 regular (383g)', calories: 510, protein: 13, carbs: 80, fat: 17, saturatedFat: 9, sodium: 280, fiber: 1, sugar: 62 },
  { id: 'mc11', restaurant: "McDonald's", restaurantId: 'mcdonalds', category: 'Drinks', name: 'Medium Coca-Cola', serving: '1 medium (21oz)', calories: 200, protein: 0, carbs: 54, fat: 0, saturatedFat: 0, sodium: 15, fiber: 0, sugar: 54 },
  { id: 'mc12', restaurant: "McDonald's", restaurantId: 'mcdonalds', category: 'Burgers', name: 'Double Quarter Pounder with Cheese', serving: '1 sandwich (341g)', calories: 900, protein: 60, carbs: 41, fat: 53, saturatedFat: 26, sodium: 1350, fiber: 2, sugar: 10 },
  { id: 'mc13', restaurant: "McDonald's", restaurantId: 'mcdonalds', category: 'Breakfast', name: 'Hotcakes', serving: '3 hotcakes (228g)', calories: 580, protein: 14, carbs: 102, fat: 15, saturatedFat: 3, sodium: 680, fiber: 3, sugar: 36 },
  { id: 'mc14', restaurant: "McDonald's", restaurantId: 'mcdonalds', category: 'Chicken', name: 'Crispy Chicken Sandwich', serving: '1 sandwich (213g)', calories: 530, protein: 28, carbs: 57, fat: 21, saturatedFat: 3.5, sodium: 1070, fiber: 3, sugar: 7 },
  { id: 'mc15', restaurant: "McDonald's", restaurantId: 'mcdonalds', category: 'Drinks', name: 'Medium Iced Coffee', serving: '1 medium (16oz)', calories: 140, protein: 2, carbs: 27, fat: 2.5, saturatedFat: 1.5, sodium: 55, fiber: 0, sugar: 26 },

  // BURGER KING
  { id: 'bk1', restaurant: 'Burger King', restaurantId: 'burgerking', category: 'Burgers', name: 'Whopper', serving: '1 sandwich (291g)', calories: 660, protein: 28, carbs: 49, fat: 40, saturatedFat: 12, sodium: 980, fiber: 2, sugar: 11 },
  { id: 'bk2', restaurant: 'Burger King', restaurantId: 'burgerking', category: 'Burgers', name: 'Double Whopper', serving: '1 sandwich (374g)', calories: 900, protein: 46, carbs: 49, fat: 57, saturatedFat: 21, sodium: 1060, fiber: 2, sugar: 11 },
  { id: 'bk3', restaurant: 'Burger King', restaurantId: 'burgerking', category: 'Burgers', name: 'Whopper with Cheese', serving: '1 sandwich (315g)', calories: 740, protein: 33, carbs: 50, fat: 46, saturatedFat: 16, sodium: 1280, fiber: 2, sugar: 11 },
  { id: 'bk4', restaurant: 'Burger King', restaurantId: 'burgerking', category: 'Chicken', name: 'Original Chicken Sandwich', serving: '1 sandwich (219g)', calories: 660, protein: 24, carbs: 57, fat: 40, saturatedFat: 8, sodium: 1220, fiber: 3, sugar: 5 },
  { id: 'bk5', restaurant: 'Burger King', restaurantId: 'burgerking', category: 'Chicken', name: 'Spicy Ch\'King Sandwich', serving: '1 sandwich (220g)', calories: 700, protein: 35, carbs: 60, fat: 35, saturatedFat: 6, sodium: 1340, fiber: 3, sugar: 7 },
  { id: 'bk6', restaurant: 'Burger King', restaurantId: 'burgerking', category: 'Sides', name: 'Medium Onion Rings', serving: '1 medium (91g)', calories: 320, protein: 4, carbs: 40, fat: 16, saturatedFat: 3, sodium: 420, fiber: 2, sugar: 5 },
  { id: 'bk7', restaurant: 'Burger King', restaurantId: 'burgerking', category: 'Sides', name: 'Medium French Fries', serving: '1 medium (117g)', calories: 380, protein: 4, carbs: 50, fat: 17, saturatedFat: 3, sodium: 570, fiber: 4, sugar: 0 },
  { id: 'bk8', restaurant: 'Burger King', restaurantId: 'burgerking', category: 'Breakfast', name: 'Croissan\'wich with Egg and Cheese', serving: '1 sandwich (118g)', calories: 340, protein: 14, carbs: 26, fat: 21, saturatedFat: 9, sodium: 730, fiber: 0, sugar: 5 },
  { id: 'bk9', restaurant: 'Burger King', restaurantId: 'burgerking', category: 'Desserts', name: 'Vanilla Milkshake Medium', serving: '1 medium (397g)', calories: 590, protein: 13, carbs: 82, fat: 25, saturatedFat: 16, sodium: 360, fiber: 0, sugar: 72 },
  { id: 'bk10', restaurant: 'Burger King', restaurantId: 'burgerking', category: 'Burgers', name: 'Bacon King', serving: '1 sandwich (399g)', calories: 1150, protein: 67, carbs: 50, fat: 79, saturatedFat: 30, sodium: 1820, fiber: 2, sugar: 11 },

  // WENDY'S
  { id: 'wen1', restaurant: "Wendy's", restaurantId: 'wendys', category: 'Burgers', name: 'Dave\'s Single', serving: '1 sandwich (247g)', calories: 590, protein: 30, carbs: 40, fat: 34, saturatedFat: 13, sodium: 1080, fiber: 2, sugar: 9 },
  { id: 'wen2', restaurant: "Wendy's", restaurantId: 'wendys', category: 'Burgers', name: 'Dave\'s Double', serving: '1 sandwich (328g)', calories: 840, protein: 50, carbs: 40, fat: 52, saturatedFat: 22, sodium: 1360, fiber: 2, sugar: 9 },
  { id: 'wen3', restaurant: "Wendy's", restaurantId: 'wendys', category: 'Chicken', name: 'Spicy Chicken Sandwich', serving: '1 sandwich (213g)', calories: 500, protein: 29, carbs: 57, fat: 17, saturatedFat: 3, sodium: 1130, fiber: 3, sugar: 6 },
  { id: 'wen4', restaurant: "Wendy's", restaurantId: 'wendys', category: 'Chicken', name: 'Crispy Chicken BLT', serving: '1 sandwich (231g)', calories: 530, protein: 28, carbs: 53, fat: 24, saturatedFat: 5, sodium: 1220, fiber: 3, sugar: 7 },
  { id: 'wen5', restaurant: "Wendy's", restaurantId: 'wendys', category: 'Sides', name: 'Medium French Fries', serving: '1 medium (142g)', calories: 420, protein: 6, carbs: 56, fat: 19, saturatedFat: 3, sodium: 410, fiber: 5, sugar: 0 },
  { id: 'wen6', restaurant: "Wendy's", restaurantId: 'wendys', category: 'Sides', name: 'Chili Small', serving: '1 small (227g)', calories: 160, protein: 15, carbs: 16, fat: 4, saturatedFat: 1.5, sodium: 780, fiber: 5, sugar: 6 },
  { id: 'wen7', restaurant: "Wendy's", restaurantId: 'wendys', category: 'Desserts', name: 'Frosty Medium Chocolate', serving: '1 medium (397g)', calories: 460, protein: 11, carbs: 74, fat: 13, saturatedFat: 8, sodium: 260, fiber: 1, sugar: 66 },
  { id: 'wen8', restaurant: "Wendy's", restaurantId: 'wendys', category: 'Breakfast', name: 'Breakfast Baconator', serving: '1 sandwich (235g)', calories: 730, protein: 37, carbs: 37, fat: 51, saturatedFat: 20, sodium: 1510, fiber: 1, sugar: 7 },
  { id: 'wen9', restaurant: "Wendy's", restaurantId: 'wendys', category: 'Salads', name: 'Apple Pecan Salad Full', serving: '1 full salad (340g)', calories: 540, protein: 36, carbs: 47, fat: 24, saturatedFat: 10, sodium: 1000, fiber: 5, sugar: 34 },
  { id: 'wen10', restaurant: "Wendy's", restaurantId: 'wendys', category: 'Chicken', name: '10 Piece Nuggets', serving: '10 pieces (153g)', calories: 420, protein: 22, carbs: 28, fat: 25, saturatedFat: 5, sodium: 890, fiber: 0, sugar: 0 },

  // CHICK-FIL-A
  { id: 'cfa1', restaurant: 'Chick-fil-A', restaurantId: 'chickfila', category: 'Chicken', name: 'Chick-fil-A Chicken Sandwich', serving: '1 sandwich (196g)', calories: 470, protein: 28, carbs: 56, fat: 17, saturatedFat: 4, sodium: 1350, fiber: 2, sugar: 6 },
  { id: 'cfa2', restaurant: 'Chick-fil-A', restaurantId: 'chickfila', category: 'Chicken', name: 'Spicy Deluxe Sandwich', serving: '1 sandwich (254g)', calories: 570, protein: 36, carbs: 57, fat: 24, saturatedFat: 7, sodium: 1650, fiber: 3, sugar: 8 },
  { id: 'cfa3', restaurant: 'Chick-fil-A', restaurantId: 'chickfila', category: 'Chicken', name: 'Grilled Chicken Sandwich', serving: '1 sandwich (196g)', calories: 320, protein: 30, carbs: 36, fat: 6, saturatedFat: 1.5, sodium: 800, fiber: 2, sugar: 7 },
  { id: 'cfa4', restaurant: 'Chick-fil-A', restaurantId: 'chickfila', category: 'Chicken', name: '8 Count Chick-n-Strips', serving: '8 strips (272g)', calories: 530, protein: 52, carbs: 30, fat: 22, saturatedFat: 4, sodium: 1680, fiber: 2, sugar: 0 },
  { id: 'cfa5', restaurant: 'Chick-fil-A', restaurantId: 'chickfila', category: 'Chicken', name: '12 Count Nuggets', serving: '12 nuggets (204g)', calories: 380, protein: 38, carbs: 18, fat: 18, saturatedFat: 3.5, sodium: 1120, fiber: 0, sugar: 1 },
  { id: 'cfa6', restaurant: 'Chick-fil-A', restaurantId: 'chickfila', category: 'Sides', name: 'Waffle Potato Fries Medium', serving: '1 medium (125g)', calories: 420, protein: 5, carbs: 50, fat: 22, saturatedFat: 4, sodium: 280, fiber: 5, sugar: 0 },
  { id: 'cfa7', restaurant: 'Chick-fil-A', restaurantId: 'chickfila', category: 'Sides', name: 'Mac & Cheese', serving: '1 medium (180g)', calories: 450, protein: 18, carbs: 39, fat: 26, saturatedFat: 12, sodium: 1000, fiber: 1, sugar: 7 },
  { id: 'cfa8', restaurant: 'Chick-fil-A', restaurantId: 'chickfila', category: 'Breakfast', name: 'Chicken Biscuit', serving: '1 biscuit (150g)', calories: 440, protein: 20, carbs: 45, fat: 20, saturatedFat: 9, sodium: 1290, fiber: 1, sugar: 5 },
  { id: 'cfa9', restaurant: 'Chick-fil-A', restaurantId: 'chickfila', category: 'Salads', name: 'Cobb Salad with Grilled Chicken', serving: '1 salad (416g)', calories: 430, protein: 40, carbs: 20, fat: 22, saturatedFat: 7, sodium: 1310, fiber: 5, sugar: 8 },
  { id: 'cfa10', restaurant: 'Chick-fil-A', restaurantId: 'chickfila', category: 'Drinks', name: 'Chick-fil-A Lemonade Medium', serving: '1 medium (20oz)', calories: 220, protein: 0, carbs: 58, fat: 0, saturatedFat: 0, sodium: 30, fiber: 0, sugar: 57 },

  // TACO BELL
  { id: 'tb1', restaurant: 'Taco Bell', restaurantId: 'tacobell', category: 'Tacos', name: 'Crunchy Taco', serving: '1 taco (89g)', calories: 170, protein: 8, carbs: 13, fat: 9, saturatedFat: 3.5, sodium: 310, fiber: 3, sugar: 1 },
  { id: 'tb2', restaurant: 'Taco Bell', restaurantId: 'tacobell', category: 'Tacos', name: 'Soft Taco Supreme', serving: '1 taco (135g)', calories: 230, protein: 11, carbs: 24, fat: 10, saturatedFat: 4.5, sodium: 590, fiber: 3, sugar: 3 },
  { id: 'tb3', restaurant: 'Taco Bell', restaurantId: 'tacobell', category: 'Burritos', name: 'Bean Burrito', serving: '1 burrito (198g)', calories: 380, protein: 14, carbs: 55, fat: 11, saturatedFat: 3.5, sodium: 1020, fiber: 9, sugar: 3 },
  { id: 'tb4', restaurant: 'Taco Bell', restaurantId: 'tacobell', category: 'Burritos', name: 'Burrito Supreme Beef', serving: '1 burrito (248g)', calories: 400, protein: 17, carbs: 51, fat: 15, saturatedFat: 7, sodium: 1100, fiber: 7, sugar: 4 },
  { id: 'tb5', restaurant: 'Taco Bell', restaurantId: 'tacobell', category: 'Burritos', name: 'Cheesy Gordita Crunch', serving: '1 item (195g)', calories: 490, protein: 20, carbs: 43, fat: 27, saturatedFat: 8, sodium: 870, fiber: 4, sugar: 4 },
  { id: 'tb6', restaurant: 'Taco Bell', restaurantId: 'tacobell', category: 'Specialties', name: 'Crunchwrap Supreme', serving: '1 item (305g)', calories: 530, protein: 20, carbs: 72, fat: 20, saturatedFat: 7, sodium: 1230, fiber: 6, sugar: 6 },
  { id: 'tb7', restaurant: 'Taco Bell', restaurantId: 'tacobell', category: 'Specialties', name: 'Quesadilla Chicken', serving: '1 item (184g)', calories: 510, protein: 27, carbs: 39, fat: 27, saturatedFat: 10, sodium: 1100, fiber: 2, sugar: 2 },
  { id: 'tb8', restaurant: 'Taco Bell', restaurantId: 'tacobell', category: 'Sides', name: 'Nachos BellGrande', serving: '1 order (308g)', calories: 740, protein: 19, carbs: 79, fat: 39, saturatedFat: 10, sodium: 1200, fiber: 12, sugar: 4 },
  { id: 'tb9', restaurant: 'Taco Bell', restaurantId: 'tacobell', category: 'Breakfast', name: 'Breakfast Crunchwrap Bacon', serving: '1 item (219g)', calories: 650, protein: 23, carbs: 67, fat: 34, saturatedFat: 11, sodium: 1310, fiber: 4, sugar: 8 },
  { id: 'tb10', restaurant: 'Taco Bell', restaurantId: 'tacobell', category: 'Desserts', name: 'Cinnabon Delights 2 Pack', serving: '2 pieces (52g)', calories: 160, protein: 2, carbs: 23, fat: 7, saturatedFat: 2.5, sodium: 105, fiber: 0, sugar: 10 },

  // CHIPOTLE
  { id: 'chp1', restaurant: 'Chipotle', restaurantId: 'chipotle', category: 'Burritos', name: 'Chicken Burrito', serving: '1 burrito (520g)', calories: 800, protein: 51, carbs: 81, fat: 28, saturatedFat: 9, sodium: 2010, fiber: 8, sugar: 6 },
  { id: 'chp2', restaurant: 'Chipotle', restaurantId: 'chipotle', category: 'Bowls', name: 'Chicken Burrito Bowl', serving: '1 bowl (490g)', calories: 640, protein: 50, carbs: 63, fat: 20, saturatedFat: 8, sodium: 1790, fiber: 8, sugar: 6 },
  { id: 'chp3', restaurant: 'Chipotle', restaurantId: 'chipotle', category: 'Bowls', name: 'Steak Burrito Bowl', serving: '1 bowl (490g)', calories: 670, protein: 46, carbs: 63, fat: 24, saturatedFat: 9, sodium: 1600, fiber: 8, sugar: 5 },
  { id: 'chp4', restaurant: 'Chipotle', restaurantId: 'chipotle', category: 'Tacos', name: 'Chicken Soft Tacos (3)', serving: '3 tacos (375g)', calories: 535, protein: 43, carbs: 60, fat: 15, saturatedFat: 5, sodium: 1510, fiber: 7, sugar: 4 },
  { id: 'chp5', restaurant: 'Chipotle', restaurantId: 'chipotle', category: 'Salads', name: 'Chicken Salad', serving: '1 salad (380g)', calories: 440, protein: 47, carbs: 23, fat: 19, saturatedFat: 7, sodium: 1200, fiber: 7, sugar: 5 },
  { id: 'chp6', restaurant: 'Chipotle', restaurantId: 'chipotle', category: 'Sides', name: 'Chips and Guacamole', serving: '1 order (156g)', calories: 490, protein: 6, carbs: 60, fat: 27, saturatedFat: 4, sodium: 420, fiber: 10, sugar: 2 },
  { id: 'chp7', restaurant: 'Chipotle', restaurantId: 'chipotle', category: 'Bowls', name: 'Sofritas Burrito Bowl', serving: '1 bowl (480g)', calories: 580, protein: 24, carbs: 70, fat: 22, saturatedFat: 6, sodium: 1690, fiber: 11, sugar: 7 },
  { id: 'chp8', restaurant: 'Chipotle', restaurantId: 'chipotle', category: 'Burritos', name: 'Barbacoa Burrito', serving: '1 burrito (520g)', calories: 830, protein: 47, carbs: 81, fat: 33, saturatedFat: 12, sodium: 2360, fiber: 8, sugar: 6 },

  // SUBWAY
  { id: 'sub1', restaurant: 'Subway', restaurantId: 'subway', category: 'Footlongs', name: 'Footlong Italian BMT', serving: '1 footlong (300g)', calories: 800, protein: 44, carbs: 72, fat: 38, saturatedFat: 14, sodium: 2440, fiber: 5, sugar: 10 },
  { id: 'sub2', restaurant: 'Subway', restaurantId: 'subway', category: 'Footlongs', name: 'Footlong Tuna', serving: '1 footlong (300g)', calories: 780, protein: 36, carbs: 68, fat: 40, saturatedFat: 8, sodium: 1190, fiber: 5, sugar: 10 },
  { id: 'sub3', restaurant: 'Subway', restaurantId: 'subway', category: 'Footlongs', name: 'Footlong Turkey Breast', serving: '1 footlong (280g)', calories: 560, protein: 36, carbs: 72, fat: 10, saturatedFat: 2.5, sodium: 1720, fiber: 5, sugar: 12 },
  { id: 'sub4', restaurant: 'Subway', restaurantId: 'subway', category: 'Footlongs', name: 'Footlong Meatball Marinara', serving: '1 footlong (380g)', calories: 960, protein: 42, carbs: 110, fat: 38, saturatedFat: 14, sodium: 2040, fiber: 8, sugar: 18 },
  { id: 'sub5', restaurant: 'Subway', restaurantId: 'subway', category: '6-inch Subs', name: '6-inch Oven Roasted Chicken', serving: '1 sandwich (220g)', calories: 320, protein: 24, carbs: 40, fat: 6, saturatedFat: 1.5, sodium: 610, fiber: 2, sugar: 6 },
  { id: 'sub6', restaurant: 'Subway', restaurantId: 'subway', category: 'Salads', name: 'Chicken Caesar Salad', serving: '1 salad (340g)', calories: 140, protein: 17, carbs: 10, fat: 5, saturatedFat: 1.5, sodium: 490, fiber: 3, sugar: 5 },
  { id: 'sub7', restaurant: 'Subway', restaurantId: 'subway', category: 'Wraps', name: 'Rotisserie Chicken Wrap', serving: '1 wrap (260g)', calories: 680, protein: 38, carbs: 52, fat: 36, saturatedFat: 10, sodium: 1280, fiber: 3, sugar: 8 },
  { id: 'sub8', restaurant: 'Subway', restaurantId: 'subway', category: 'Sides', name: 'Chocolate Chip Cookie', serving: '1 cookie (45g)', calories: 220, protein: 2, carbs: 30, fat: 10, saturatedFat: 5, sodium: 160, fiber: 1, sugar: 18 },

  // PANERA BREAD
  { id: 'pan1', restaurant: 'Panera Bread', restaurantId: 'panera', category: 'Sandwiches', name: 'Smokehouse BBQ Chicken Sandwich', serving: '1 sandwich (295g)', calories: 720, protein: 40, carbs: 71, fat: 30, saturatedFat: 9, sodium: 1680, fiber: 4, sugar: 20 },
  { id: 'pan2', restaurant: 'Panera Bread', restaurantId: 'panera', category: 'Sandwiches', name: 'Bacon Turkey Bravo Sandwich', serving: '1 sandwich (298g)', calories: 700, protein: 42, carbs: 67, fat: 28, saturatedFat: 10, sodium: 2170, fiber: 4, sugar: 10 },
  { id: 'pan3', restaurant: 'Panera Bread', restaurantId: 'panera', category: 'Soups', name: 'Broccoli Cheddar Soup Bread Bowl', serving: '1 bowl (595g)', calories: 920, protein: 34, carbs: 114, fat: 36, saturatedFat: 18, sodium: 2000, fiber: 5, sugar: 12 },
  { id: 'pan4', restaurant: 'Panera Bread', restaurantId: 'panera', category: 'Soups', name: 'Broccoli Cheddar Soup Cup', serving: '1 cup (226g)', calories: 230, protein: 8, carbs: 19, fat: 14, saturatedFat: 7, sodium: 770, fiber: 2, sugar: 4 },
  { id: 'pan5', restaurant: 'Panera Bread', restaurantId: 'panera', category: 'Salads', name: 'Caesar Salad with Chicken', serving: '1 salad (340g)', calories: 470, protein: 31, carbs: 23, fat: 30, saturatedFat: 8, sodium: 960, fiber: 3, sugar: 4 },
  { id: 'pan6', restaurant: 'Panera Bread', restaurantId: 'panera', category: 'Breakfast', name: 'Bacon Egg and Cheese on Bagel', serving: '1 sandwich (219g)', calories: 560, protein: 28, carbs: 57, fat: 25, saturatedFat: 11, sodium: 1140, fiber: 2, sugar: 5 },
  { id: 'pan7', restaurant: 'Panera Bread', restaurantId: 'panera', category: 'Bakery', name: 'Cinnamon Roll', serving: '1 roll (225g)', calories: 690, protein: 12, carbs: 104, fat: 24, saturatedFat: 13, sodium: 720, fiber: 2, sugar: 45 },
  { id: 'pan8', restaurant: 'Panera Bread', restaurantId: 'panera', category: 'Salads', name: 'Green Goddess Cobb Salad', serving: '1 salad (416g)', calories: 520, protein: 42, carbs: 19, fat: 32, saturatedFat: 9, sodium: 1250, fiber: 5, sugar: 7 },
  { id: 'pan9', restaurant: 'Panera Bread', restaurantId: 'panera', category: 'Drinks', name: 'Mango Smoothie', serving: '1 small (355ml)', calories: 260, protein: 4, carbs: 57, fat: 2.5, saturatedFat: 1.5, sodium: 95, fiber: 2, sugar: 49 },
  { id: 'pan10', restaurant: 'Panera Bread', restaurantId: 'panera', category: 'Sandwiches', name: 'Grilled Cheese Sandwich', serving: '1 sandwich (198g)', calories: 650, protein: 27, carbs: 56, fat: 36, saturatedFat: 20, sodium: 1310, fiber: 2, sugar: 5 },

  // STARBUCKS
  { id: 'sbx1', restaurant: 'Starbucks', restaurantId: 'starbucks', category: 'Hot Drinks', name: 'Grande Caffe Latte', serving: '1 grande (16oz)', calories: 190, protein: 13, carbs: 19, fat: 7, saturatedFat: 4.5, sodium: 170, fiber: 0, sugar: 18 },
  { id: 'sbx2', restaurant: 'Starbucks', restaurantId: 'starbucks', category: 'Cold Drinks', name: 'Grande Frappuccino Mocha', serving: '1 grande (16oz)', calories: 420, protein: 5, carbs: 66, fat: 15, saturatedFat: 9, sodium: 230, fiber: 1, sugar: 61 },
  { id: 'sbx3', restaurant: 'Starbucks', restaurantId: 'starbucks', category: 'Hot Drinks', name: 'Grande Caramel Macchiato', serving: '1 grande (16oz)', calories: 250, protein: 10, carbs: 34, fat: 7, saturatedFat: 4, sodium: 150, fiber: 0, sugar: 33 },
  { id: 'sbx4', restaurant: 'Starbucks', restaurantId: 'starbucks', category: 'Cold Drinks', name: 'Grande Cold Brew', serving: '1 grande (16oz)', calories: 5, protein: 0, carbs: 0, fat: 0, saturatedFat: 0, sodium: 15, fiber: 0, sugar: 0 },
  { id: 'sbx5', restaurant: 'Starbucks', restaurantId: 'starbucks', category: 'Food', name: 'Spinach Feta Wrap', serving: '1 wrap (127g)', calories: 290, protein: 19, carbs: 33, fat: 10, saturatedFat: 3.5, sodium: 840, fiber: 3, sugar: 3 },
  { id: 'sbx6', restaurant: 'Starbucks', restaurantId: 'starbucks', category: 'Food', name: 'Butter Croissant', serving: '1 croissant (76g)', calories: 270, protein: 5, carbs: 33, fat: 14, saturatedFat: 8, sodium: 270, fiber: 1, sugar: 8 },
  { id: 'sbx7', restaurant: 'Starbucks', restaurantId: 'starbucks', category: 'Food', name: 'Bacon Gouda Sandwich', serving: '1 sandwich (130g)', calories: 370, protein: 18, carbs: 32, fat: 19, saturatedFat: 8, sodium: 830, fiber: 1, sugar: 8 },
  { id: 'sbx8', restaurant: 'Starbucks', restaurantId: 'starbucks', category: 'Cold Drinks', name: 'Grande Pink Drink', serving: '1 grande (16oz)', calories: 140, protein: 2, carbs: 27, fat: 2.5, saturatedFat: 2, sodium: 65, fiber: 1, sugar: 24 },
  { id: 'sbx9', restaurant: 'Starbucks', restaurantId: 'starbucks', category: 'Hot Drinks', name: 'Grande Pumpkin Spice Latte', serving: '1 grande (16oz)', calories: 380, protein: 14, carbs: 52, fat: 14, saturatedFat: 9, sodium: 240, fiber: 0, sugar: 50 },
  { id: 'sbx10', restaurant: 'Starbucks', restaurantId: 'starbucks', category: 'Food', name: 'Chocolate Croissant', serving: '1 croissant (82g)', calories: 310, protein: 6, carbs: 38, fat: 16, saturatedFat: 9, sodium: 280, fiber: 2, sugar: 14 },

  // KFC
  { id: 'kfc1', restaurant: 'KFC', restaurantId: 'kfc', category: 'Chicken', name: 'Original Recipe Chicken Breast', serving: '1 piece (161g)', calories: 390, protein: 39, carbs: 11, fat: 21, saturatedFat: 4.5, sodium: 1010, fiber: 0, sugar: 0 },
  { id: 'kfc2', restaurant: 'KFC', restaurantId: 'kfc', category: 'Chicken', name: 'Extra Crispy Chicken Breast', serving: '1 piece (165g)', calories: 530, protein: 35, carbs: 24, fat: 35, saturatedFat: 6, sodium: 1230, fiber: 1, sugar: 0 },
  { id: 'kfc3', restaurant: 'KFC', restaurantId: 'kfc', category: 'Chicken', name: 'Original Recipe Chicken Thigh', serving: '1 piece (126g)', calories: 280, protein: 21, carbs: 8, fat: 18, saturatedFat: 4, sodium: 730, fiber: 0, sugar: 0 },
  { id: 'kfc4', restaurant: 'KFC', restaurantId: 'kfc', category: 'Sandwiches', name: 'Chicken Little Sandwich', serving: '1 sandwich (107g)', calories: 310, protein: 14, carbs: 27, fat: 17, saturatedFat: 3, sodium: 520, fiber: 1, sugar: 3 },
  { id: 'kfc5', restaurant: 'KFC', restaurantId: 'kfc', category: 'Sides', name: 'Mashed Potatoes with Gravy', serving: '1 individual (136g)', calories: 130, protein: 3, carbs: 20, fat: 4.5, saturatedFat: 1, sodium: 530, fiber: 1, sugar: 0 },
  { id: 'kfc6', restaurant: 'KFC', restaurantId: 'kfc', category: 'Sides', name: 'Mac and Cheese', serving: '1 individual (127g)', calories: 140, protein: 6, carbs: 17, fat: 6, saturatedFat: 2.5, sodium: 560, fiber: 1, sugar: 3 },
  { id: 'kfc7', restaurant: 'KFC', restaurantId: 'kfc', category: 'Sides', name: 'Cole Slaw', serving: '1 individual (130g)', calories: 150, protein: 1, carbs: 21, fat: 7, saturatedFat: 1, sodium: 220, fiber: 2, sugar: 16 },
  { id: 'kfc8', restaurant: 'KFC', restaurantId: 'kfc', category: 'Chicken', name: '6 Piece Nuggets', serving: '6 nuggets (100g)', calories: 250, protein: 14, carbs: 14, fat: 15, saturatedFat: 2.5, sodium: 600, fiber: 0, sugar: 0 },
  { id: 'kfc9', restaurant: 'KFC', restaurantId: 'kfc', category: 'Desserts', name: 'Chocolate Chip Cookie', serving: '1 cookie (35g)', calories: 160, protein: 2, carbs: 22, fat: 8, saturatedFat: 4, sodium: 105, fiber: 1, sugar: 13 },
  { id: 'kfc10', restaurant: 'KFC', restaurantId: 'kfc', category: 'Sandwiches', name: 'Crispy Colonel Sandwich', serving: '1 sandwich (213g)', calories: 510, protein: 26, carbs: 46, fat: 25, saturatedFat: 4, sodium: 1130, fiber: 2, sugar: 6 },

  // PIZZA HUT
  { id: 'ph1', restaurant: 'Pizza Hut', restaurantId: 'pizzahut', category: 'Pizza', name: 'Pepperoni Pizza Medium Hand Tossed (2 slices)', serving: '2 slices (196g)', calories: 520, protein: 24, carbs: 60, fat: 22, saturatedFat: 9, sodium: 1160, fiber: 2, sugar: 4 },
  { id: 'ph2', restaurant: 'Pizza Hut', restaurantId: 'pizzahut', category: 'Pizza', name: 'Cheese Pizza Medium Hand Tossed (2 slices)', serving: '2 slices (180g)', calories: 460, protein: 20, carbs: 58, fat: 18, saturatedFat: 8, sodium: 920, fiber: 2, sugar: 4 },
  { id: 'ph3', restaurant: 'Pizza Hut', restaurantId: 'pizzahut', category: 'Pizza', name: 'Supreme Pizza Medium Pan (2 slices)', serving: '2 slices (220g)', calories: 640, protein: 26, carbs: 66, fat: 30, saturatedFat: 12, sodium: 1360, fiber: 3, sugar: 6 },
  { id: 'ph4', restaurant: 'Pizza Hut', restaurantId: 'pizzahut', category: 'Wings', name: 'Traditional Wings 6 Piece', serving: '6 wings (204g)', calories: 540, protein: 50, carbs: 2, fat: 38, saturatedFat: 10, sodium: 1590, fiber: 0, sugar: 0 },
  { id: 'ph5', restaurant: 'Pizza Hut', restaurantId: 'pizzahut', category: 'Sides', name: 'Breadsticks 2 Piece', serving: '2 sticks (90g)', calories: 200, protein: 7, carbs: 36, fat: 4, saturatedFat: 1, sodium: 380, fiber: 1, sugar: 2 },
  { id: 'ph6', restaurant: 'Pizza Hut', restaurantId: 'pizzahut', category: 'Pasta', name: 'Meaty Marinara Pasta', serving: '1 order (340g)', calories: 580, protein: 26, carbs: 66, fat: 24, saturatedFat: 10, sodium: 1560, fiber: 5, sugar: 9 },
  { id: 'ph7', restaurant: 'Pizza Hut', restaurantId: 'pizzahut', category: 'Desserts', name: 'Cinnamon Sticks', serving: '2 sticks (78g)', calories: 230, protein: 5, carbs: 37, fat: 7, saturatedFat: 2, sodium: 260, fiber: 1, sugar: 10 },

  // DOMINO'S
  { id: 'dom1', restaurant: "Domino's", restaurantId: 'dominos', category: 'Pizza', name: 'Pepperoni Pizza Medium Hand Tossed (2 slices)', serving: '2 slices (186g)', calories: 520, protein: 22, carbs: 58, fat: 24, saturatedFat: 10, sodium: 1200, fiber: 2, sugar: 4 },
  { id: 'dom2', restaurant: "Domino's", restaurantId: 'dominos', category: 'Pizza', name: 'ExtravaganZZa Pizza Medium (2 slices)', serving: '2 slices (224g)', calories: 580, protein: 26, carbs: 60, fat: 28, saturatedFat: 12, sodium: 1380, fiber: 3, sugar: 6 },
  { id: 'dom3', restaurant: "Domino's", restaurantId: 'dominos', category: 'Pizza', name: 'Pacific Veggie Pizza Medium (2 slices)', serving: '2 slices (210g)', calories: 490, protein: 20, carbs: 62, fat: 18, saturatedFat: 8, sodium: 980, fiber: 3, sugar: 6 },
  { id: 'dom4', restaurant: "Domino's", restaurantId: 'dominos', category: 'Wings', name: 'Hot Buffalo Wings 8 Piece', serving: '8 wings (220g)', calories: 460, protein: 44, carbs: 6, fat: 28, saturatedFat: 8, sodium: 1820, fiber: 1, sugar: 1 },
  { id: 'dom5', restaurant: "Domino's", restaurantId: 'dominos', category: 'Sides', name: 'Garlic Bread Twists 8 Piece', serving: '8 twists (200g)', calories: 480, protein: 12, carbs: 72, fat: 16, saturatedFat: 4, sodium: 960, fiber: 3, sugar: 4 },
  { id: 'dom6', restaurant: "Domino's", restaurantId: 'dominos', category: 'Pasta', name: 'Italian Sausage Marinara Pasta', serving: '1 bowl (340g)', calories: 620, protein: 28, carbs: 76, fat: 22, saturatedFat: 9, sodium: 1690, fiber: 5, sugar: 8 },
  { id: 'dom7', restaurant: "Domino's", restaurantId: 'dominos', category: 'Sandwiches', name: 'Chicken Bacon Ranch Sandwich', serving: '1 sandwich (230g)', calories: 620, protein: 34, carbs: 58, fat: 28, saturatedFat: 9, sodium: 1420, fiber: 2, sugar: 7 },

  // POPEYES
  { id: 'pop1', restaurant: 'Popeyes', restaurantId: 'popeyes', category: 'Chicken', name: 'Spicy Chicken Sandwich', serving: '1 sandwich (198g)', calories: 700, protein: 28, carbs: 50, fat: 42, saturatedFat: 8, sodium: 1610, fiber: 2, sugar: 4 },
  { id: 'pop2', restaurant: 'Popeyes', restaurantId: 'popeyes', category: 'Chicken', name: 'Classic Chicken Sandwich', serving: '1 sandwich (198g)', calories: 699, protein: 28, carbs: 50, fat: 42, saturatedFat: 8, sodium: 1443, fiber: 2, sugar: 4 },
  { id: 'pop3', restaurant: 'Popeyes', restaurantId: 'popeyes', category: 'Chicken', name: 'Spicy Chicken Breast', serving: '1 piece (163g)', calories: 420, protein: 34, carbs: 17, fat: 26, saturatedFat: 7, sodium: 1330, fiber: 1, sugar: 0 },
  { id: 'pop4', restaurant: 'Popeyes', restaurantId: 'popeyes', category: 'Sides', name: 'Red Beans and Rice Regular', serving: '1 regular (173g)', calories: 230, protein: 8, carbs: 31, fat: 9, saturatedFat: 3, sodium: 680, fiber: 5, sugar: 1 },
  { id: 'pop5', restaurant: 'Popeyes', restaurantId: 'popeyes', category: 'Sides', name: 'Mashed Potatoes with Gravy', serving: '1 regular (180g)', calories: 110, protein: 2, carbs: 18, fat: 3.5, saturatedFat: 1, sodium: 560, fiber: 1, sugar: 1 },
  { id: 'pop6', restaurant: 'Popeyes', restaurantId: 'popeyes', category: 'Sides', name: 'Cajun Fries Regular', serving: '1 regular (113g)', calories: 310, protein: 4, carbs: 40, fat: 15, saturatedFat: 3, sodium: 530, fiber: 4, sugar: 0 },
  { id: 'pop7', restaurant: 'Popeyes', restaurantId: 'popeyes', category: 'Chicken', name: '6 Piece Nuggets', serving: '6 nuggets (135g)', calories: 330, protein: 17, carbs: 22, fat: 19, saturatedFat: 4, sodium: 670, fiber: 1, sugar: 1 },

  // SHAKE SHACK
  { id: 'ss1', restaurant: 'Shake Shack', restaurantId: 'shakeshack', category: 'Burgers', name: 'ShackBurger', serving: '1 burger (196g)', calories: 530, protein: 27, carbs: 40, fat: 31, saturatedFat: 12, sodium: 820, fiber: 1, sugar: 9 },
  { id: 'ss2', restaurant: 'Shake Shack', restaurantId: 'shakeshack', category: 'Burgers', name: 'SmokeShack', serving: '1 burger (229g)', calories: 590, protein: 33, carbs: 40, fat: 35, saturatedFat: 14, sodium: 1170, fiber: 1, sugar: 9 },
  { id: 'ss3', restaurant: 'Shake Shack', restaurantId: 'shakeshack', category: 'Burgers', name: 'Double ShackBurger', serving: '1 burger (296g)', calories: 780, protein: 44, carbs: 41, fat: 50, saturatedFat: 21, sodium: 1110, fiber: 1, sugar: 9 },
  { id: 'ss4', restaurant: 'Shake Shack', restaurantId: 'shakeshack', category: 'Chicken', name: 'Crispy Chicken Sandwich', serving: '1 sandwich (216g)', calories: 560, protein: 28, carbs: 55, fat: 26, saturatedFat: 5, sodium: 1220, fiber: 2, sugar: 8 },
  { id: 'ss5', restaurant: 'Shake Shack', restaurantId: 'shakeshack', category: 'Sides', name: 'Crinkle Cut Fries', serving: '1 regular (155g)', calories: 420, protein: 6, carbs: 57, fat: 19, saturatedFat: 3.5, sodium: 890, fiber: 4, sugar: 0 },
  { id: 'ss6', restaurant: 'Shake Shack', restaurantId: 'shakeshack', category: 'Shakes', name: 'Vanilla Shake', serving: '1 regular (414g)', calories: 680, protein: 15, carbs: 86, fat: 33, saturatedFat: 21, sodium: 360, fiber: 0, sugar: 79 },
  { id: 'ss7', restaurant: 'Shake Shack', restaurantId: 'shakeshack', category: 'Shakes', name: 'Chocolate Shake', serving: '1 regular (444g)', calories: 760, protein: 16, carbs: 100, fat: 35, saturatedFat: 22, sodium: 430, fiber: 2, sugar: 89 },

  // FIVE GUYS
  { id: 'fg1', restaurant: 'Five Guys', restaurantId: 'fiveguys', category: 'Burgers', name: 'Hamburger', serving: '1 burger (195g)', calories: 700, protein: 40, carbs: 39, fat: 43, saturatedFat: 18, sodium: 430, fiber: 2, sugar: 7 },
  { id: 'fg2', restaurant: 'Five Guys', restaurantId: 'fiveguys', category: 'Burgers', name: 'Cheeseburger', serving: '1 burger (220g)', calories: 840, protein: 48, carbs: 40, fat: 55, saturatedFat: 26, sodium: 710, fiber: 2, sugar: 7 },
  { id: 'fg3', restaurant: 'Five Guys', restaurantId: 'fiveguys', category: 'Burgers', name: 'Bacon Cheeseburger', serving: '1 burger (240g)', calories: 920, protein: 52, carbs: 40, fat: 62, saturatedFat: 28, sodium: 1060, fiber: 2, sugar: 7 },
  { id: 'fg4', restaurant: 'Five Guys', restaurantId: 'fiveguys', category: 'Hot Dogs', name: 'Hot Dog', serving: '1 hot dog (130g)', calories: 590, protein: 21, carbs: 40, fat: 39, saturatedFat: 16, sodium: 840, fiber: 2, sugar: 7 },
  { id: 'fg5', restaurant: 'Five Guys', restaurantId: 'fiveguys', category: 'Sides', name: 'Regular Fries', serving: '1 regular (411g)', calories: 953, protein: 14, carbs: 131, fat: 41, saturatedFat: 7, sodium: 962, fiber: 12, sugar: 1 },
  { id: 'fg6', restaurant: 'Five Guys', restaurantId: 'fiveguys', category: 'Sides', name: 'Cajun Style Fries', serving: '1 regular (411g)', calories: 953, protein: 14, carbs: 131, fat: 41, saturatedFat: 7, sodium: 1474, fiber: 12, sugar: 1 },
  { id: 'fg7', restaurant: 'Five Guys', restaurantId: 'fiveguys', category: 'Sandwiches', name: 'Grilled Cheese', serving: '1 sandwich (145g)', calories: 550, protein: 20, carbs: 41, fat: 37, saturatedFat: 18, sodium: 690, fiber: 2, sugar: 7 },

  // PANDA EXPRESS
  { id: 'pe1', restaurant: 'Panda Express', restaurantId: 'pandaexpress', category: 'Entrees', name: 'Orange Chicken', serving: '5.7oz (162g)', calories: 420, protein: 15, carbs: 43, fat: 21, saturatedFat: 4, sodium: 820, fiber: 0, sugar: 18 },
  { id: 'pe2', restaurant: 'Panda Express', restaurantId: 'pandaexpress', category: 'Entrees', name: 'Broccoli Beef', serving: '5.4oz (153g)', calories: 150, protein: 9, carbs: 13, fat: 7, saturatedFat: 1.5, sodium: 710, fiber: 2, sugar: 7 },
  { id: 'pe3', restaurant: 'Panda Express', restaurantId: 'pandaexpress', category: 'Entrees', name: 'Kung Pao Chicken', serving: '5.9oz (167g)', calories: 290, protein: 19, carbs: 22, fat: 14, saturatedFat: 2.5, sodium: 990, fiber: 2, sugar: 7 },
  { id: 'pe4', restaurant: 'Panda Express', restaurantId: 'pandaexpress', category: 'Entrees', name: 'Honey Sesame Chicken', serving: '5.8oz (164g)', calories: 340, protein: 15, carbs: 35, fat: 16, saturatedFat: 3, sodium: 490, fiber: 2, sugar: 19 },
  { id: 'pe5', restaurant: 'Panda Express', restaurantId: 'pandaexpress', category: 'Entrees', name: 'Beijing Beef', serving: '6.0oz (170g)', calories: 470, protein: 13, carbs: 57, fat: 22, saturatedFat: 5, sodium: 650, fiber: 2, sugar: 25 },
  { id: 'pe6', restaurant: 'Panda Express', restaurantId: 'pandaexpress', category: 'Sides', name: 'Fried Rice', serving: '8.1oz (230g)', calories: 520, protein: 11, carbs: 85, fat: 16, saturatedFat: 3, sodium: 850, fiber: 3, sugar: 3 },
  { id: 'pe7', restaurant: 'Panda Express', restaurantId: 'pandaexpress', category: 'Sides', name: 'Chow Mein', serving: '9.4oz (266g)', calories: 510, protein: 13, carbs: 80, fat: 15, saturatedFat: 3, sodium: 860, fiber: 6, sugar: 8 },
  { id: 'pe8', restaurant: 'Panda Express', restaurantId: 'pandaexpress', category: 'Sides', name: 'Super Greens', serving: '7.4oz (210g)', calories: 90, protein: 6, carbs: 10, fat: 3, saturatedFat: 0.5, sodium: 370, fiber: 5, sugar: 3 },
  { id: 'pe9', restaurant: 'Panda Express', restaurantId: 'pandaexpress', category: 'Appetizers', name: 'Chicken Egg Roll', serving: '1 roll (85g)', calories: 200, protein: 7, carbs: 26, fat: 8, saturatedFat: 2, sodium: 390, fiber: 2, sugar: 1 },
  { id: 'pe10', restaurant: 'Panda Express', restaurantId: 'pandaexpress', category: 'Entrees', name: 'Mushroom Chicken', serving: '5.5oz (156g)', calories: 220, protein: 13, carbs: 13, fat: 13, saturatedFat: 2.5, sodium: 720, fiber: 2, sugar: 4 },

  // SONIC
  { id: 'son1', restaurant: 'Sonic', restaurantId: 'sonic', category: 'Burgers', name: 'Sonic Cheeseburger', serving: '1 burger (213g)', calories: 580, protein: 26, carbs: 44, fat: 35, saturatedFat: 12, sodium: 990, fiber: 2, sugar: 9 },
  { id: 'son2', restaurant: 'Sonic', restaurantId: 'sonic', category: 'Chicken', name: 'Crispy Chicken Sandwich', serving: '1 sandwich (208g)', calories: 590, protein: 24, carbs: 60, fat: 29, saturatedFat: 5, sodium: 1290, fiber: 3, sugar: 7 },
  { id: 'son3', restaurant: 'Sonic', restaurantId: 'sonic', category: 'Hot Dogs', name: 'Corn Dog', serving: '1 corn dog (89g)', calories: 210, protein: 6, carbs: 27, fat: 9, saturatedFat: 3, sodium: 480, fiber: 0, sugar: 8 },
  { id: 'son4', restaurant: 'Sonic', restaurantId: 'sonic', category: 'Sides', name: 'Medium Tots', serving: '1 medium (113g)', calories: 360, protein: 4, carbs: 45, fat: 19, saturatedFat: 3, sodium: 560, fiber: 4, sugar: 0 },
  { id: 'son5', restaurant: 'Sonic', restaurantId: 'sonic', category: 'Drinks', name: 'Medium Cherry Limeade', serving: '1 medium (20oz)', calories: 220, protein: 0, carbs: 58, fat: 0, saturatedFat: 0, sodium: 10, fiber: 0, sugar: 57 },
  { id: 'son6', restaurant: 'Sonic', restaurantId: 'sonic', category: 'Shakes', name: 'Medium Vanilla Shake', serving: '1 medium (391g)', calories: 540, protein: 11, carbs: 76, fat: 23, saturatedFat: 15, sodium: 280, fiber: 0, sugar: 66 },

  // DAIRY QUEEN
  { id: 'dq1', restaurant: 'Dairy Queen', restaurantId: 'dairyqueen', category: 'Burgers', name: 'DQ Bacon Double Cheeseburger', serving: '1 burger (228g)', calories: 640, protein: 38, carbs: 34, fat: 40, saturatedFat: 17, sodium: 1200, fiber: 1, sugar: 8 },
  { id: 'dq2', restaurant: 'Dairy Queen', restaurantId: 'dairyqueen', category: 'Chicken', name: 'Crispy Chicken Sandwich', serving: '1 sandwich (198g)', calories: 500, protein: 22, carbs: 55, fat: 22, saturatedFat: 4, sodium: 1140, fiber: 2, sugar: 6 },
  { id: 'dq3', restaurant: 'Dairy Queen', restaurantId: 'dairyqueen', category: 'Desserts', name: 'Medium Blizzard Oreo', serving: '1 medium (397g)', calories: 760, protein: 16, carbs: 106, fat: 30, saturatedFat: 17, sodium: 460, fiber: 1, sugar: 79 },
  { id: 'dq4', restaurant: 'Dairy Queen', restaurantId: 'dairyqueen', category: 'Desserts', name: 'Dipped Cone Medium', serving: '1 medium (213g)', calories: 490, protein: 8, carbs: 63, fat: 24, saturatedFat: 14, sodium: 160, fiber: 1, sugar: 53 },
  { id: 'dq5', restaurant: 'Dairy Queen', restaurantId: 'dairyqueen', category: 'Sides', name: 'Medium French Fries', serving: '1 medium (128g)', calories: 380, protein: 5, carbs: 50, fat: 17, saturatedFat: 3, sodium: 490, fiber: 4, sugar: 0 },
  { id: 'dq6', restaurant: 'Dairy Queen', restaurantId: 'dairyqueen', category: 'Desserts', name: 'Banana Split', serving: '1 split (369g)', calories: 500, protein: 7, carbs: 97, fat: 12, saturatedFat: 7, sodium: 170, fiber: 2, sugar: 79 },

  // WINGSTOP
  { id: 'ws1', restaurant: 'Wingstop', restaurantId: 'wingstop', category: 'Wings', name: 'Classic Wings 6 Piece Lemon Pepper', serving: '6 wings (204g)', calories: 530, protein: 38, carbs: 2, fat: 40, saturatedFat: 11, sodium: 1490, fiber: 0, sugar: 0 },
  { id: 'ws2', restaurant: 'Wingstop', restaurantId: 'wingstop', category: 'Wings', name: 'Classic Wings 6 Piece Buffalo', serving: '6 wings (204g)', calories: 430, protein: 38, carbs: 2, fat: 30, saturatedFat: 9, sodium: 2230, fiber: 0, sugar: 0 },
  { id: 'ws3', restaurant: 'Wingstop', restaurantId: 'wingstop', category: 'Wings', name: 'Boneless Wings 6 Piece', serving: '6 pieces (180g)', calories: 430, protein: 26, carbs: 36, fat: 19, saturatedFat: 4, sodium: 1230, fiber: 2, sugar: 0 },
  { id: 'ws4', restaurant: 'Wingstop', restaurantId: 'wingstop', category: 'Sides', name: 'Large Seasoned Fries', serving: '1 large (256g)', calories: 670, protein: 9, carbs: 88, fat: 32, saturatedFat: 6, sodium: 1800, fiber: 8, sugar: 0 },
  { id: 'ws5', restaurant: 'Wingstop', restaurantId: 'wingstop', category: 'Sides', name: 'Cheese Sauce', serving: '2oz (57g)', calories: 100, protein: 2, carbs: 6, fat: 8, saturatedFat: 4, sodium: 490, fiber: 0, sugar: 2 },
  { id: 'ws6', restaurant: 'Wingstop', restaurantId: 'wingstop', category: 'Wings', name: 'Classic Wings 10 Piece Mango Habanero', serving: '10 wings (340g)', calories: 740, protein: 62, carbs: 18, fat: 46, saturatedFat: 13, sodium: 2640, fiber: 1, sugar: 14 },

  // BUFFALO WILD WINGS
  { id: 'bww1', restaurant: 'Buffalo Wild Wings', restaurantId: 'buffalowildwings', category: 'Wings', name: 'Traditional Wings 9 Piece', serving: '9 wings (306g)', calories: 780, protein: 66, carbs: 0, fat: 54, saturatedFat: 18, sodium: 2160, fiber: 0, sugar: 0 },
  { id: 'bww2', restaurant: 'Buffalo Wild Wings', restaurantId: 'buffalowildwings', category: 'Wings', name: 'Boneless Wings 9 Piece', serving: '9 pieces (306g)', calories: 720, protein: 42, carbs: 60, fat: 30, saturatedFat: 7, sodium: 2070, fiber: 3, sugar: 2 },
  { id: 'bww3', restaurant: 'Buffalo Wild Wings', restaurantId: 'buffalowildwings', category: 'Burgers', name: 'Whiskey BBQ Burger', serving: '1 burger (350g)', calories: 1010, protein: 50, carbs: 84, fat: 51, saturatedFat: 20, sodium: 2120, fiber: 4, sugar: 24 },
  { id: 'bww4', restaurant: 'Buffalo Wild Wings', restaurantId: 'buffalowildwings', category: 'Sides', name: 'Street Tacos 3 Piece', serving: '3 tacos (285g)', calories: 570, protein: 32, carbs: 57, fat: 22, saturatedFat: 10, sodium: 1310, fiber: 5, sugar: 6 },
  { id: 'bww5', restaurant: 'Buffalo Wild Wings', restaurantId: 'buffalowildwings', category: 'Sides', name: 'Fried Pickles', serving: '1 order (184g)', calories: 560, protein: 8, carbs: 68, fat: 28, saturatedFat: 5, sodium: 2380, fiber: 3, sugar: 5 },
  { id: 'bww6', restaurant: 'Buffalo Wild Wings', restaurantId: 'buffalowildwings', category: 'Sides', name: 'Onion Rings', serving: '1 order (170g)', calories: 490, protein: 7, carbs: 68, fat: 22, saturatedFat: 4, sodium: 1040, fiber: 3, sugar: 11 },

  // IN-N-OUT
  { id: 'ino1', restaurant: 'In-N-Out Burger', restaurantId: 'innout', category: 'Burgers', name: 'Hamburger', serving: '1 burger (243g)', calories: 390, protein: 16, carbs: 37, fat: 19, saturatedFat: 5, sodium: 650, fiber: 3, sugar: 10 },
  { id: 'ino2', restaurant: 'In-N-Out Burger', restaurantId: 'innout', category: 'Burgers', name: 'Cheeseburger', serving: '1 burger (268g)', calories: 480, protein: 22, carbs: 39, fat: 27, saturatedFat: 10, sodium: 1000, fiber: 3, sugar: 10 },
  { id: 'ino3', restaurant: 'In-N-Out Burger', restaurantId: 'innout', category: 'Burgers', name: 'Double Double', serving: '1 burger (330g)', calories: 670, protein: 37, carbs: 39, fat: 41, saturatedFat: 18, sodium: 1440, fiber: 3, sugar: 10 },
  { id: 'ino4', restaurant: 'In-N-Out Burger', restaurantId: 'innout', category: 'Burgers', name: 'Double Double Animal Style', serving: '1 burger (395g)', calories: 750, protein: 39, carbs: 47, fat: 45, saturatedFat: 19, sodium: 1520, fiber: 4, sugar: 16 },
  { id: 'ino5', restaurant: 'In-N-Out Burger', restaurantId: 'innout', category: 'Sides', name: 'French Fries', serving: '1 order (125g)', calories: 395, protein: 7, carbs: 54, fat: 18, saturatedFat: 5, sodium: 245, fiber: 2, sugar: 0 },
  { id: 'ino6', restaurant: 'In-N-Out Burger', restaurantId: 'innout', category: 'Shakes', name: 'Chocolate Shake', serving: '1 shake (425g)', calories: 590, protein: 11, carbs: 82, fat: 26, saturatedFat: 17, sodium: 340, fiber: 1, sugar: 75 },
  // WHATABURGER
  { id: 'wb1', restaurant: 'Whataburger', restaurantId: 'whataburger', category: 'Burgers', name: 'Whataburger', serving: '1 burger (310g)', calories: 590, protein: 28, carbs: 61, fat: 26, saturatedFat: 9, sodium: 1080, fiber: 3, sugar: 10 },
  { id: 'wb2', restaurant: 'Whataburger', restaurantId: 'whataburger', category: 'Burgers', name: 'Double Meat Whataburger', serving: '1 burger (408g)', calories: 830, protein: 46, carbs: 61, fat: 45, saturatedFat: 16, sodium: 1380, fiber: 3, sugar: 10 },
  { id: 'wb3', restaurant: 'Whataburger', restaurantId: 'whataburger', category: 'Breakfast', name: 'Breakfast on a Bun with Bacon', serving: '1 sandwich (162g)', calories: 400, protein: 21, carbs: 29, fat: 22, saturatedFat: 8, sodium: 1010, fiber: 1, sugar: 5 },
  { id: 'wb4', restaurant: 'Whataburger', restaurantId: 'whataburger', category: 'Sides', name: 'Medium French Fries', serving: '1 medium (117g)', calories: 360, protein: 5, carbs: 46, fat: 17, saturatedFat: 3, sodium: 480, fiber: 4, sugar: 0 },
  { id: 'wb5', restaurant: 'Whataburger', restaurantId: 'whataburger', category: 'Chicken', name: 'Crispy Chicken Sandwich', serving: '1 sandwich (225g)', calories: 530, protein: 24, carbs: 59, fat: 22, saturatedFat: 4, sodium: 1170, fiber: 3, sugar: 7 },

  // JACK IN THE BOX
  { id: 'jib1', restaurant: 'Jack in the Box', restaurantId: 'jackinthebox', category: 'Burgers', name: 'Jumbo Jack', serving: '1 burger (263g)', calories: 600, protein: 24, carbs: 51, fat: 34, saturatedFat: 12, sodium: 940, fiber: 3, sugar: 10 },
  { id: 'jib2', restaurant: 'Jack in the Box', restaurantId: 'jackinthebox', category: 'Burgers', name: 'Ultimate Cheeseburger', serving: '1 burger (310g)', calories: 930, protein: 43, carbs: 51, fat: 65, saturatedFat: 26, sodium: 1380, fiber: 2, sugar: 10 },
  { id: 'jib3', restaurant: 'Jack in the Box', restaurantId: 'jackinthebox', category: 'Breakfast', name: 'Breakfast Jack', serving: '1 sandwich (130g)', calories: 360, protein: 18, carbs: 30, fat: 19, saturatedFat: 7, sodium: 760, fiber: 1, sugar: 5 },
  { id: 'jib4', restaurant: 'Jack in the Box', restaurantId: 'jackinthebox', category: 'Sides', name: 'Medium Curly Fries', serving: '1 medium (117g)', calories: 380, protein: 5, carbs: 47, fat: 19, saturatedFat: 4, sodium: 770, fiber: 4, sugar: 0 },
  { id: 'jib5', restaurant: 'Jack in the Box', restaurantId: 'jackinthebox', category: 'Tacos', name: 'Monster Taco', serving: '1 taco (113g)', calories: 280, protein: 11, carbs: 22, fat: 16, saturatedFat: 6, sodium: 490, fiber: 2, sugar: 2 },

];

export const RESTAURANT_ITEMS = RESTAURANT_DATA;

export function getRestaurantsWithCounts() {
  const chains = new Map();
  RESTAURANT_DATA.forEach((item) => {
    if (!chains.has(item.restaurantId)) {
      chains.set(item.restaurantId, {
        id: item.restaurantId,
        name: item.restaurant,
        color: CHAIN_COLORS[item.restaurantId] || null,
        itemCount: 0,
      });
    }
    chains.get(item.restaurantId).itemCount += 1;
  });
  return Array.from(chains.values());
}

export function getItemsByRestaurant(restaurantId) {
  return RESTAURANT_DATA.filter((item) => item.restaurantId === restaurantId);
}

export function searchRestaurantItems(query, restaurantId) {
  let items = RESTAURANT_DATA;
  if (restaurantId) {
    items = items.filter((item) => item.restaurantId === restaurantId);
  }
  if (!query || query.trim() === '') {
    return items;
  }
  const q = query.toLowerCase();
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.restaurant.toLowerCase().includes(q)
  );
}
