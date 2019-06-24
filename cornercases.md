# Corner Cases.

Sites that implement things weirdly, or have bug fixes custom written.


HTML tags encoded in recipe:

- https://www.thespruce.com/easy-vegan-vegetable-rice-biryani-3378477

Image is a list rather than a string:

- https://cafedelites.com/best-fluffy-pancakes/

InstructionText is actually a list in disguise:

- https://www.thespruce.com/vegetarian-tempeh-taco-recipe-3377159

Double encoded HTML:

- https://www.thespruce.com/vegetarian-tempeh-taco-recipe-3377159

Two names:

- http://www.eatingwell.com/recipe/257781/chipotle-lime-cauliflower-tacos/

Single ingredient:

- https://minimalistbaker.com/how-to-make-cauliflower-rice/

Instructions list uses HowToStep schema

- https://yupitsvegan.com/vegan-shepherds-pie-lentil/

Using `@graph` in JSON-LD data.

- https://cookieandkate.com/spicy-vegan-black-bean-soup/

## Regression checks

### Undetected Recipe:

- http://allrecipes.com/recipe/238987/paleo-cauliflower-rice/
- https://cookieandkate.com/spicy-vegan-black-bean-soup/
