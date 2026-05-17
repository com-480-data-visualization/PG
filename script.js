document.addEventListener("DOMContentLoaded", () => {
    initBipartiteGraph();

    // Load the data for the map
    loadDataForViz2().then(() => {
        initCulturalMap();
    });


    // Handles going from the round graph of a recipe to the recipe list
    document.getElementById("back-to-recipes").addEventListener("click", () => {
        d3.select("#graph-panel").style("display", "none");
        d3.select("#compounds-panel").style("display", "none");
        d3.select("#recipe-list-panel").style("display", "block");
    });

    // Manage the event when we close the compound panel of an edge in the circular graph
    document.getElementById("close-compounds").addEventListener("click", (event) => {
        event.stopPropagation(); 
        const compoundsPanel = d3.select("#compounds-panel");
        compoundsPanel.style("display", "none");
        
        // Remove the specific edge selection class
        const links = d3.selectAll(".links path").classed("selected-edge", false);
        
        // Check if an ingredient is still selected to display only its edges
        const selectedNode = d3.select(".nodes g.selected");
        
        if (selectedNode.empty()) {
            // No ingredient selected => Back to showing all the edges in the graph
            links.transition().duration(300)
                .attr("stroke", "var(--flavor-matcha)")
                .attr("opacity", 0.5);
        } else {
            // An ingredient => Back to showing the edges connected to the node
            const nodeData = selectedNode.datum();
            links.transition().duration(300)
                 .attr("opacity", link => (link.source === nodeData.id || link.target === nodeData.id) ? 0.9 : 0.05)
                 .attr("stroke", link => (link.source === nodeData.id || link.target === nodeData.id) ? "var(--flavor-mango)" : "var(--flavor-matcha)");
        }
    });

    // If a user clicks on the compound panel, it doesn't do anything
    document.getElementById("compounds-panel").addEventListener("click", (event) => {
        event.stopPropagation();
    });

    // Handles deselection by clicking outside of the region we are looking
    document.getElementById("graph-panel").addEventListener("click", () => {
        const compoundsPanel = d3.select("#compounds-panel");
        const links = d3.selectAll(".links path");

        const isEdgeSelected = !links.filter(".selected-edge").empty();
        
        // If a compound panel is open
        if (isEdgeSelected) {
            // If a user clicks outside of the compound panel, close it (if the user doesn't click on an edge of course)
            compoundsPanel.style("display", "none");
            links.classed("selected-edge", false);
            
            // If an ingredient was selected previously, rehighlight only the corresponding edges otherwise the graph goes back to default
            const selectedNode = d3.select(".nodes g.selected");
            if (selectedNode.empty()) {
                links.transition().duration(300)
                     .attr("opacity", 0.5)
                     .attr("stroke", "var(--flavor-matcha)");
            } else {
                const nodeData = selectedNode.datum();
                links.transition().duration(300)
                     .attr("opacity", link => (link.source === nodeData.id || link.target === nodeData.id) ? 0.9 : 0.05)
                     .attr("stroke", link => (link.source === nodeData.id || link.target === nodeData.id) ? "var(--flavor-mango)" : "var(--flavor-matcha)");
            }
        } else { // If no compound panel is open and we click outside of the selected edge
            // If a user clicks outside (meaning not an ingredient or an edge) of the currently highlighted graph, go back to default (deselect ingredient)
            d3.selectAll(".nodes g").classed("selected", false);
            links.transition().duration(300)
                 .attr("opacity", 0.5)
                 .attr("stroke", "var(--flavor-matcha)");
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // If the section scrolls into view
            if (entry.isIntersecting) {
                // Check which section it is
                if (entry.target.id === 'network-explorer') {
                    // Start animating or initializing Viz 1
                    console.log("User reached the Bipartite Graph!");
                }
                if (entry.target.id === 'cultural-maps') {
                    console.log("User reached the Map!");
                }
            }
        });
    }, { threshold: 0.5 }); // Triggers when 50% of the section is visible

    document.querySelectorAll('.viz-card').forEach(card => {
        observer.observe(card);
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const scrollContainer = document.getElementById('cultural-maps');
    const leftBtn = document.getElementById('scroll-left-btn');
    const rightBtn = document.getElementById('scroll-right-btn');

    if (!scrollContainer || !leftBtn || !rightBtn) return;

    // Function to check scroll position and hide/show arrows
    function updateArrows() {
        const buffer = 50; 

        // If we are near the very left, hide the left arrow
        if (scrollContainer.scrollLeft <= buffer) {
            leftBtn.classList.add('hidden');
        } else {
            leftBtn.classList.remove('hidden');
        }

        // Calculate max scroll distance
        const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        
        // If we are near the very right, hide the right arrow
        if (Math.ceil(scrollContainer.scrollLeft) >= maxScrollLeft - buffer) {
            rightBtn.classList.add('hidden');
        } else {
            rightBtn.classList.remove('hidden');
        }
    }

    // Scroll to the left when the left arrow is clicked
    leftBtn.addEventListener('click', () => {
        scrollContainer.scrollBy({ left: -window.innerWidth, behavior: 'smooth' });
    });

    // Scroll to the right when the right arrow is clicked
    rightBtn.addEventListener('click', () => {
        scrollContainer.scrollBy({ left: window.innerWidth, behavior: 'smooth' });
    });

    // Listen for manual scrolling
    scrollContainer.addEventListener('scroll', updateArrows);
    
    // Listen for window resizes just in case
    window.addEventListener('resize', updateArrows);

    // Run it once on load to ensure the left arrow starts hidden
    updateArrows();
});

// ----- Adding missing mappings ----- //
const ingredientMapping = {
    "flour": "wheat",
    "pepper bell": "bell_pepper",
    "salt pepper": "pepper",
    "chocolate": "cocoa",
    "onion red": "roasted_onion",
    "bay leaf": "laurel",
    "wine white": "white_wine",
    "paprika": "pepper",
    "sesame": "sesame_seed",
    "cheese parmesan": "parmesan_cheese",
    "sunflower": "sunflower_oil",
    "sausage": "pork_sausage",
    "canola oil": "vegetable_oil",
    "spinach": "dried_spinach",
    "cornstarch": "starch",
    "cheese cheddar": "cheddar_cheese",
    "syrup": "maple_syrup",
    "tomato paste": "tomato",
    "parmesan  cheese": "parmesan_cheese",
    "tortilla": "corn_tortilla",
    "cheese cream": "cream_cheese",
    "sauce  soybean": "soy_sauce",
    "steak": "tea",
    "pepper white": "pepper",
    "cheese mozzarella": "mozzarella_cheese",
    "cider vinegar": "vinegar",
    "wine red": "red_wine",
    "cocoa powder": "cocoa",
    "coconut milk": "coconut_oil",
    "hot sauce": "soy_sauce",
    "eggplant": "plant",
    "ice": "rice",
    "cheese ricotta": "cottage_cheese",
    "cherry tomato": "cherry",
    "ice cream": "cream_cheese",
    "pine": "wine",
    "cheese feta": "feta_cheese",
    "potato sweet": "sweet_potato",
    "mustard oil": "mustard",
    "asparagu": "asparagus",
    "curry leaf": "currant_leaf",
    "bean green": "green_tea",
    "coriander seed": "coriander",
    "bread white": "white_bread",
    "molass": "cane_molasses",
    "cheese goat": "goat_cheese",
    "mozzarella  cheese": "mozzarella_cheese",
    "crabmeat": "meat",
    "cheddar  cheese": "cheddar_cheese",
    "cheese cottage": "cottage_cheese",
    "paste  tomato": "tomato",
    "vegetable broth": "vegetable_oil",
    "milk evaporated": "milk",
    "mascarpone": "macaroni",
    "bean kidney": "kidney_bean",
    "butternut squash": "butter",
    "milk condensed": "milk",
    "tomato puree": "tomato_juice",
    "cheese swis": "swiss_cheese",
    "watercres": "watercress",
    "cheese blue": "blue_cheese",
    "lemongras": "lemongrass",
    "cheese romano": "romano_cheese",
    "vegetable stock": "vegetable_oil",
    "anise star": "star_anise",
    "champagne": "champagne_wine",
    "tortilla chip": "corn_tortilla",
    "graham cracker": "ham",
    "bean mung": "mung_bean",
    "ginger garlic paste": "garlic",
    "squash yellow": "squash",
    "salad": "corn_salad",
    "poppy seed": "seed",
    "romano  cheese": "romano_cheese",
    "cheese provolone": "provolone_cheese",
    "hamburger": "ham",
    "cake": "sake",
    "bread pita": "white_bread",
    "rice brown": "brown_rice",
    "plantain french": "plant",
    "ricotta  cheese": "cottage_cheese",
    "chard": "pilchard",
    "bas": "basil",
    "oregano mexican": "oregano",
    "liquid smoke": "smoke",
    "chestnut": "nut",
    "pea black eyed": "dried_black_tea",
    "carom seed": "seed",
    "feta  cheese": "feta_cheese",
    "pimiento": "pimento",
    "cheese gruyere": "gruyere_cheese",
    "kaffir beer": "beer",
    "pea pigeon": "pea",
    "grit  corn": "corn_grit",
    "drumstick leaf": "leaf",
    "onion spring": "onion",
    "water chestnut": "chestnut_flower",
    "pie": "pike",
    "cognac  brandy": "cognac",
    "brussel sprout": "brussels_sprout",
    "applesauce": "apple_sauce",
    "lemon gras": "lemongrass",
    "coriander cumin seed powder": "coriander",
    "pepper sweet": "pepper",
    "pork fat": "raw_pork",
    "pita  bread": "bread",
    "bean lima": "lima_bean",
    "bread whole wheat": "wheaten_bread",
    "rice wild": "wild_rice",
    "string  bean": "bean",
    "bean red kidney": "kidney_bean",
    "sweet corn": "corn",
    "provolone  cheese": "provolone_cheese",
    "cornbread": "bread",
    "nigella seed": "angelica_seed",
    "old bay seasoning": "bay",
    "swordfish": "fish",
    "safflower": "flower",
    "mixed vegetable": "vegetable",
    "mushroom oyster": "mushroom",
    "bun": "origanum_floribundum",
    "milk powder": "milk",
    "puree  tomato": "tomato_juice",
    "corn flour": "corn",
    "bean haricot": "bean",
    "brown  rice": "brown_rice",
    "bread rye": "rye_bread",
    "brandy cognac": "cognac",
    "meatball": "meat",
    "gruyere  cheese": "gruyere_cheese",
    "bean red": "red_bean",
    "cherry pepper": "cherry",
    "cherry sour": "sour_cherry",
    "spanish  sage": "spanish_sage",
    "custard": "mustard",
    "corn bread": "crisp_bread",
    "egg roll": "egg",
    "juice  apple": "apple_juice",
    "bean french": "french_bean",
    "haricot  bean": "bean",
    "rabbit": "rabbiteye_blueberry",
    "monosodium glutamate": "mate",
    "citru": "citrus",
    "tea black": "black_tea",
    "currant red": "red_currant",
    "spring  onion": "onion",
    "pea chick": "chickpea",
    "smoked  fish": "smoked_fish",
    "soy milk": "sour_milk",
    "vegetable juice": "vegetable_oil",
    "brandy apple": "apple_brandy",
    "corn chip": "chicory",
    "agave": "algae",
    "arrowroot": "root",
    "cocoa butter": "butter",
    "pate": "mate",
    "octopu": "octopus",
    "tea green": "green_tea",
    "hard  wheat": "wheat_bread",
    "tea leaf willow": "tea_leaf_oil",
    "goose": "cape_gooseberry",
    "flower  sesbania": "flower",
    "cheese white": "swiss_cheese",
    "monkfish": "fish",
    "cherry sweet": "cherry",
    "armagnac brandy": "armagnac",
    "flax seed": "seed",
    "cheese roquefort": "roquefort_cheese",
    "butter bean": "peanut_butter",
    "ale": "kale",
    "blue  cheese": "blue_cheese",
    "cashew nut": "cashew",
    "butternut pumpkin": "pumpkin",
    "broccolini": "broccoli",
    "toffee": "coffee",
    "candied mixed fruit": "fruit",
    "cracker crumb": "rum",
    "lotu": "melilotus_albus_leaf",
    "jam  strawberry": "strawberry_jam",
    "zucchini green": "zucchini",
    "mixed nut": "nut",
    "gram  bean": "raw_bean",
    "orange sour": "orange_oil",
    "huckleberry black": "huckleberry",
    "meatloaf": "meat",
    "raspberry red": "raspberry_brandy",
    "bean string": "bean",
    "star  anise": "star_anise",
    "dried mixed fruit": "fruit",
    "bagel": "bael",
    "gratin  potato": "raw_potato",
    "vinegar cider": "vinegar",
    "tumeric": "turmeric",
    "rockfish": "fish",
    "cheese sheep": "sheep_cheese",
    "boysenberry": "berry",
    "soy bean": "soybean",
    "savory summer": "summer_savory",
    "bluefish": "fish",
    "currant black": "black_currant",
    "cheese camembert": "camembert_cheese",
    "orange bitter": "bitter_orange",
    "verbena lemon": "verbena_oil",
    "lean  fish": "lean_fish",
    "flaxseed": "seed",
    "gooseberry": "cape_gooseberry",
    "candy bar": "brandy",
    "pear prickly": "prickly_pear",
    "armagnac brandy": "armagnac",
    "raspberry black": "black_raspberry",
    "roquefort  cheese": "roquefort_cheese",
    "frankfurter sausage": "frankfurter",
    "codfish": "fish",
    "camembert  cheese": "camembert_cheese",
    "meat loaf": "mate_leaf",
    "american  pokeweed": "ewe",
    "potato bread": "baked_potato",
    "squash winter": "squash",
    "waterchestnut": "nut",
    "fried  potato": "french_fried_potato",
    "corn starch": "starch",
    "bread multigrain": "bread",
    "carp": "carpinus_betulus",
    "potato fried": "french_fried_potato",
    "brandy pear": "pear_brandy",
    "poppyseed": "seed",
    "orange roughy": "orange",
    "field  bean": "bean",
    "sturgeon": "estragon",
    "sea  cucumber": "cucumber",
    "hibiscu  tea": "tea",
    "bean cluster": "bean",
    "bread wheaten": "wheaten_bread",
    "berry saskatoon": "berry",
    "bream": "cream",
    "swis  cheese": "swiss_cheese",
    "laver": "liver",
    "yoghurt": "yogurt",
    "chia": "aristolochia_clematitis",
    "kiwifruit": "fruit",
    "canadian whiskey": "whiskey",
    "agar": "agarwood",
    "oriental  wheat": "wheat",
    "quesadilla": "dill",
    "ice cream cone": "cream",
    "cherry morello": "cherry",
    "garden  bean": "bean",
    "whisky": "whiskey",
    "potato gratin": "raw_potato",
    "tea hibiscu": "tea",
    "butterfish": "cuttlefish",
    "cornflour": "corn",
    "bean gram": "raw_bean",
    "tile fish": "lean_fish",
    "cres": "watercress",
    "melon horned": "melon",
    "pike northern": "pike",
    "soymilk": "sour_milk",
    "ginseng": "gin",
    "verbena lemon": "verbena_oil",
    "fruit salad": "sapodilla_fruit",
    "rye": "rye_flour",
    "scrapple": "apple",
    "bean adzuki": "bean",
    "lemon sole": "lemon_oil",
    "cheese emmental": "emmental_cheese",
    "canola oil": "vegetable_oil",
    "beetroot": "beet_root",
    "blackfish": "fish",
    "camomile": "chamomile",
    "fireweed": "ewe",
    "passionfruit": "passion_fruit",
    "frankfurter sausage": "frankfurter",
    "ostrich": "starch",
    "soya bean oil": "soybean_oil",
    "hyssop oil": "hop_oil",
    "salmonberry": "loganberry",
    "spirit": "wood_spirit",
    "sago  palm": "palm",
    "multigrain  bread": "bread",
    "deer": "beer",
    "lingcod": "cod",
    "butternut": "butter",
    "cheese comte": "comte_cheese",
    "besan": "bean",
    "crispbread": "crisp_bread",
    "sieve  bean": "bean",
    "condensed  milk": "milk",
    "chicken masala powder": "chicken",
    "bean moong": "mung_bean",
    "fish fatty": "fatty_fish",
    "whiskey malt": "malt_whiskey",
    "fry bread": "rye_bread",
    "liquorice": "licorice",
    "soy yogurt": "yogurt",
    "sablefish": "fish",
    "aubergine": "gin",
    "bread oat": "wheat_bread",
    "fish smoked": "smoked_fish",
    "bread rice": "rye_bread",
    "mastic": "mastic_gum",
    "fermented  tea": "fermented_tea",
    "chick  pea": "chickpea",
    "bourbon whisky": "bourbon_whiskey",
    "guar  bean": "bean",
    "cluster  bean": "bean",
    "currant white": "white_currant_juice",
    "pear barlett": "bartlett_pear",
    "puff  potato": "potato",
    "savory winter": "winter_savory",
    "soy cream": "cream",
    "summer  savory": "summer_savory",
    "cardamon": "cardamom",
    "satsuma  mandarin": "satsuma_mandarin_peel",
    "nut ginkgo": "nut",
    "hing": "pouching_tea",
    "paste dried  shrimp": "shrimp",
    "gras": "lemongrass",
    "cabbage swamp": "raw_cabbage",
    "lima  bean": "lima_bean",
    "borage": "orange",
    "sage red": "red_sage",
    "bean flageolet": "bean",
    "emmental  cheese": "emmental_cheese",
    "soya sauce": "soy_sauce",
    "salad corn": "corn_salad",
    "sassafra": "sassafras",
    "maitake": "matsutake",
    "hazel nut": "hazelnut",
    "soya bean": "soybean",
    "soybean sauce": "soy_sauce",
    "jellyfish": "shellfish",
    "drum": "rum",
    "bear": "pear",
    "drumstick leaf": "leaf",
    "rice red": "red_wine",
    "ginger garlic coriander leaf": "coriander",
    "turkey berry": "turkey",
    "bean yardlong": "bean",
    "fish lean": "lean_fish",
    "tea rooibo": "rooibus_tea",
    "milkfish": "milk",
    "mandarin satsuma": "satsuma_mandarin_peel",
    "maize flour": "maize",
    "roe": "rose",
    "ginkgo  nut": "nut",
    "cuttle fish": "cuttlefish",
    "cheese munster": "munster_cheese",
    "wheat hard": "wheat_bread",
    "bean garden": "bean",
    "primrose": "rose",
    "alga red": "algae",
    "mulberry": "berry",
    "breadfruit": "bread",
    "whisky malt": "malt_whiskey",
    "soy bean sauce": "soy_sauce",
    "ling": "lingonberry",
    "perch": "peach",
};

// ----- Viz 1 ----- //
async function initBipartiteGraph() {
    const wrapper = d3.select("#svg-wrapper");
    const width = wrapper.node().getBoundingClientRect().width || 800;
    const margin = { top: 30, right: 150, bottom: 30, left: 150 };

    const svg = wrapper.append("svg")
        .attr("width", "100%")
        .attr("height", "400px");

    const linkGroup = svg.append("g").attr("class", "links");
    const rightNodeGroup = svg.append("g").attr("class", "right-nodes");
    const leftNodeGroup = svg.append("g").attr("class", "left-nodes");

    try {
        const ingrInfo = await d3.tsv("data/ingr_info.tsv");
        const compInfo = await d3.tsv("data/comp_info.tsv");
        const ingrComp = await d3.tsv("data/ingr_comp.tsv");

        const idToIngrName = new Map(ingrInfo.map(d => [d["# id"], d["ingredient name"].replace(/_/g, ' ')]));
        const idToCompName = new Map(compInfo.map(d => [d["# id"], d["Compound name"].replace(/_/g, ' ')]));
        
        const allIngredientsList = Array.from(idToIngrName.entries()).map(([id, name]) => ({id, name}));

        const logicalNames = [
            "tomato", "basil", "garlic", "butter", "onion", "roasted beef", 
            "coffee", "cocoa", "strawberry", "vanilla", "lemon", "chicken", 
            "pork", "apple", "black pepper", "cinnamon"
        ];
        
        const featuredIngredients = allIngredientsList.filter(d => 
            logicalNames.some(logical => d.name.toLowerCase() === logical)
        );

        let initialIds = [];
        allIngredientsList.forEach(d => {
            if (d.name.toLowerCase() === "tomato" || d.name.toLowerCase() === "basil") {
                initialIds.push(d.id);
            }
        });

        let activeIngredientIds = new Set(initialIds.length > 0 ? initialIds : [featuredIngredients[0].id, featuredIngredients[1].id]); 
        let compoundFilterMode = "all";

        const btnIngr = document.getElementById("btn-ingredients");
        const menuIngr = document.getElementById("menu-ingredients");
        const searchInput = document.getElementById("ingr-search");
        const searchResults = document.getElementById("search-results");
        
        const btnComp = document.getElementById("btn-compounds");
        const menuComp = document.getElementById("menu-compounds");
        const radioFilters = document.querySelectorAll('input[name="comp-filter"]');

        function showSuggestions(query) {
            searchResults.innerHTML = "";
            let matches = [];
            
            if (!query || query.trim() === "") {
                matches = featuredIngredients.slice(0, 15);
            } else {
                matches = allIngredientsList.filter(d => d.name.toLowerCase().includes(query)).slice(0, 15);
            }
            
            matches.forEach(match => {
                const li = document.createElement("li");
                li.innerHTML = `<strong>+</strong> ${match.name}`;
                li.addEventListener("click", () => {
                    activeIngredientIds.add(match.id);
                    searchInput.value = "";
                    menuIngr.classList.remove("active");
                    updateGraph(); 
                });
                searchResults.appendChild(li);
            });
        }

        btnIngr.addEventListener("click", () => {
            menuIngr.classList.toggle("active");
            menuComp.classList.remove("active");
            if (menuIngr.classList.contains("active")) {
                showSuggestions(searchInput.value.toLowerCase());
                searchInput.focus();
            }
        });

        btnComp.addEventListener("click", () => {
            menuComp.classList.toggle("active");
            menuIngr.classList.remove("active");
        });

        searchInput.addEventListener("input", (e) => {
            showSuggestions(e.target.value.toLowerCase());
        });

        radioFilters.forEach(radio => {
            radio.addEventListener("change", (e) => {
                compoundFilterMode = e.target.value;
                updateGraph(); 
            });
        });

        function updateGraph() {
            if (activeIngredientIds.size === 0) {
                svg.transition().duration(300).attr("height", 100);
                linkGroup.selectAll("path").remove();
                leftNodeGroup.selectAll("g").remove();
                rightNodeGroup.selectAll("g").remove();
                return;
            }

            const activeEdges = ingrComp.filter(d => activeIngredientIds.has(d["# ingredient id"]));
            const compoundCounts = d3.rollup(activeEdges, v => v.length, d => d["compound id"]);

            let activeCompoundIds = Array.from(compoundCounts.keys());
            
            if (compoundFilterMode === "shared") {
                activeCompoundIds = activeCompoundIds.filter(id => compoundCounts.get(id) > 1);
            } else if (compoundFilterMode === "unique") {
                activeCompoundIds = activeCompoundIds.filter(id => compoundCounts.get(id) === 1);
            } else if (compoundFilterMode === "all-shared") {
                activeCompoundIds = activeCompoundIds.filter(id => compoundCounts.get(id) === activeIngredientIds.size);
            }

            const finalEdges = activeEdges.filter(d => activeCompoundIds.includes(d["compound id"]));

            const minHeight = 400;
            const requiredHeight = Math.max(minHeight, activeCompoundIds.length * 14); 

            svg.transition().duration(300)
               .attr("height", requiredHeight)
               .attr("viewBox", [0, 0, width, requiredHeight]);

            const leftX = margin.left;
            const rightX = width - margin.right;
            
            const yScaleLeft = d3.scalePoint()
                .domain(Array.from(activeIngredientIds))
                .range([margin.top, requiredHeight - margin.bottom])
                .padding(0.5);

            const yScaleRight = d3.scalePoint()
                .domain(activeCompoundIds)
                .range([margin.top, requiredHeight - margin.bottom])
                .padding(0.5);

            const linkGenerator = d3.linkHorizontal().x(d => d.x).y(d => d.y);

            linkGroup.selectAll("path")
                .data(finalEdges, d => d["# ingredient id"] + "-" + d["compound id"])
                .join(
                    enter => enter.append("path")
                        .attr("fill", "none")
                        .attr("stroke", "#dfe4ea")
                        .attr("stroke-width", 1.5)
                        .attr("stroke-opacity", 0)
                        .attr("d", d => linkGenerator({
                            source: { x: leftX, y: yScaleLeft(d["# ingredient id"]) },
                            target: { x: rightX, y: yScaleRight(d["compound id"]) }
                        }))
                        .call(enter => enter.transition().duration(500).attr("stroke-opacity", 0.4)),
                    update => update.transition().duration(500)
                        .attr("d", d => linkGenerator({
                            source: { x: leftX, y: yScaleLeft(d["# ingredient id"]) },
                            target: { x: rightX, y: yScaleRight(d["compound id"]) }
                        })),
                    exit => exit.transition().duration(300).attr("stroke-opacity", 0).remove()
                );

            leftNodeGroup.selectAll("g")
                .data(Array.from(activeIngredientIds), d => d)
                .join(
                    enter => {
                        const g = enter.append("g")
                            .attr("transform", d => `translate(${leftX},${yScaleLeft(d)})`)
                            .style("cursor", "pointer")
                            .style("opacity", 0);
                            
                        g.append("circle").attr("r", 6).attr("fill", "var(--flavor-strawberry)");
                        g.append("text").attr("x", -12).attr("y", 4).attr("text-anchor", "end").style("font-size", "12px").style("font-weight", "bold").attr("fill", "var(--text-dark)")
                         .text(d => idToIngrName.get(d) || "Unknown");
                         
                        g.on("mouseover", function(event, d) {
                            d3.select(this).select("circle").attr("r", 9).attr("fill", "var(--flavor-mango)");
                            
                            const connectedCompIds = new Set(finalEdges.filter(e => e["# ingredient id"] === d).map(e => e["compound id"]));

                            linkGroup.selectAll("path")
                                .style("stroke-opacity", linkData => linkData["# ingredient id"] === d ? 0.8 : 0.05)
                                .style("stroke", linkData => linkData["# ingredient id"] === d ? "var(--flavor-mango)" : "#dfe4ea")
                                .style("stroke-width", linkData => linkData["# ingredient id"] === d ? 2 : 1.5);
                                
                            rightNodeGroup.selectAll("text")
                                .style("font-weight", compD => connectedCompIds.has(compD) ? "bold" : "normal")
                                .attr("fill", compD => connectedCompIds.has(compD) ? "var(--text-dark)" : "#747d8c");
                                
                        }).on("mouseout", function() {
                            d3.select(this).select("circle").attr("r", 6).attr("fill", "var(--flavor-strawberry)");
                            
                            linkGroup.selectAll("path")
                                .style("stroke-opacity", 0.4).style("stroke", "#dfe4ea").style("stroke-width", 1.5);
                                
                            rightNodeGroup.selectAll("text")
                                .style("font-weight", "normal")
                                .attr("fill", "#747d8c");
                        });

                        g.on("click", (event, d) => {
                            activeIngredientIds.delete(d);
                            updateGraph();
                        });

                        return g.call(enter => enter.transition().duration(500).style("opacity", 1));
                    },
                    update => update.transition().duration(500).attr("transform", d => `translate(${leftX},${yScaleLeft(d)})`),
                    exit => exit.transition().duration(300).style("opacity", 0).remove()
                );

            rightNodeGroup.selectAll("g")
                .data(activeCompoundIds, d => d)
                .join(
                    enter => {
                        const g = enter.append("g")
                            .attr("transform", d => `translate(${rightX},${yScaleRight(d)})`)
                            .style("opacity", 0)
                            .style("cursor", "pointer");
                            
                        g.append("circle").attr("r", 3).attr("fill", "var(--flavor-blueberry)");
                        
                        g.append("text").attr("x", 10).attr("y", 3).attr("text-anchor", "start").style("font-size", "10px").attr("fill", "#747d8c")
                         .style("opacity", 1)
                         .text(d => idToCompName.get(d) || "Unknown");

                        g.on("mouseover", function(event, d) {
                            d3.select(this).select("circle").attr("r", 6).attr("fill", "var(--flavor-matcha)");
                            d3.select(this).select("text").attr("fill", "var(--text-dark)").style("font-weight", "bold");
                            linkGroup.selectAll("path")
                                .style("stroke-opacity", linkData => linkData["compound id"] === d ? 0.8 : 0.05)
                                .style("stroke", linkData => linkData["compound id"] === d ? "var(--flavor-matcha)" : "#dfe4ea")
                                .style("stroke-width", linkData => linkData["compound id"] === d ? 2 : 1.5);
                        }).on("mouseout", function() {
                            d3.select(this).select("circle").attr("r", 3).attr("fill", "var(--flavor-blueberry)");
                            d3.select(this).select("text").attr("fill", "#747d8c").style("font-weight", "normal");
                            linkGroup.selectAll("path")
                                .style("stroke-opacity", 0.4).style("stroke", "#dfe4ea").style("stroke-width", 1.5);
                        });

                        return g.call(enter => enter.transition().duration(500).style("opacity", 1));
                    },
                    update => update.transition().duration(500).attr("transform", d => `translate(${rightX},${yScaleRight(d)})`),
                    exit => exit.transition().duration(300).style("opacity", 0).remove()
                );
        }

        updateGraph();

    } catch (error) {
        console.error("Error loading or processing data:", error);
    }
}

// ----- Viz 2 ----- //
// Draw the circular graph for the selected recipe
function buildCircularGraph(recipe) {
    // Hide the recipe list panel and the compound panel at first and show the graph
    d3.select("#recipe-list-panel").style("display", "none");
    d3.select("#compounds-panel").style("display", "none");
    d3.select("#graph-panel").style("display", "flex"); 
    d3.select("#recipe-title").text(recipe.Title);

    // If there was a circular graph before => remove it before building the new one
    const container = d3.select("#circular-graph");
    container.selectAll("*").remove(); 
    
    // Calculate dimensions
    const width = container.node().clientWidth || 300;
    const height = width;
    const radius = (width / 2) - 150; 

    // Create Base SVG
    const svgBase = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const svg = svgBase.append("g")
        .attr("transform", `translate(${width/2}, ${height/2})`);

    // Get the map of ingredients and compounds for the graph
    const graphData = calculateSharedCompounds(recipe); 

    if (graphData.nodes.length === 0) {
        svg.append("text").attr("text-anchor", "middle").text("No ingredient data found.");
        return;
    }

    // Mathematical positioning for a perfect circle
    const angleGen = d3.scaleLinear()
        .domain([0, graphData.nodes.length])
        .range([0, 2 * Math.PI]);

    graphData.nodes.forEach((d, i) => {
        d.angle = angleGen(i);
        d.x = radius * Math.cos(d.angle - Math.PI/2);
        d.y = radius * Math.sin(d.angle - Math.PI/2);
    });

    // Draw Edges
    const linkGroup = svg.append("g").attr("class", "links");
    const links = linkGroup.selectAll("path")
        .data(graphData.links)
        .enter().append("path")
        .attr("d", d => {
            const source = graphData.nodes.find(n => n.id === d.source);
            const target = graphData.nodes.find(n => n.id === d.target);
            return `M ${source.x} ${source.y} Q 0 0 ${target.x} ${target.y}`;
        })
        .attr("fill", "none")
        .attr("stroke", "var(--flavor-matcha)")
        .attr("stroke-width", d => Math.max(1, (d.sharedCount / d.maxShared) * 8))
        .attr("opacity", 0.5)
        .style("cursor", "pointer")
        .on("mouseover", function() { d3.select(this).attr("stroke", "var(--flavor-mango)").attr("opacity", 1); }) // Mouse hovering increases opacity
        .on("mouseout", function(event, d) { 
            const selection = d3.select(this);
            
            // If this IS the selected edge, don't change anything
            if (selection.classed("selected-edge")) return;

            // Check current state of the graph
            const isAnyEdgeSelected = !linkGroup.selectAll("path.selected-edge").empty();
            const selectedNode = svg.selectAll(".nodes g.selected");
            const isAnyNodeSelected = !selectedNode.empty();

            if (isAnyEdgeSelected) {
                // If a panel is open for a DIFFERENT edge, go back to being dimmed so that we can hover other edges without it messing up the graph
                selection.attr("stroke", "var(--flavor-matcha)").attr("opacity", 0.1);
            } 
            else if (isAnyNodeSelected) {
                // If an ingredient is selected, check if this edge belongs to it and adapt opacity accordingly
                const nodeData = selectedNode.datum();
                const isConnected = (d.source === nodeData.id || d.target === nodeData.id);
                
                selection.attr("stroke", isConnected ? "var(--flavor-mango)" : "var(--flavor-matcha)")
                         .attr("opacity", isConnected ? 0.9 : 0.05);
            } 
            else {
                // Normal state: no panel open, no ingredient selected
                selection.attr("stroke", "var(--flavor-matcha)").attr("opacity", 0.5);
            }
        })
        .on("click", function(event, d) {
            event.stopPropagation(); 

            // Deselect and put all edges in the background by lowering the opacity
            links.classed("selected-edge", false)
                 .attr("stroke", "var(--flavor-matcha)")
                 .attr("opacity", 0.1);

            // Bring forth the edfe on which the user clicked by increasing its opacity
            d3.select(this).classed("selected-edge", true)
                .attr("stroke", "var(--flavor-mango)")
                .attr("opacity", 1);

            // Create the shared compounds panel
            const compoundsPanel = d3.select("#compounds-panel");
            compoundsPanel.style("display", "flex");

            // Number of compounds shared is displayed at the top
            d3.select("#edge-ingredients-label").text(`${d.source} + ${d.target} (${d.sharedCount} shared)`);
            
            // Add a scrollable list of all the shared compounds
            const ul = d3.select("#shared-compounds-list");
            ul.selectAll("*").remove();
            ul.selectAll("li")
                .data(d.compounds)
                .enter().append("li")
                .text(c => c)
                .style("font-size", "0.85rem")
                .style("padding", "3px 0")
                .style("border-bottom", "1px solid var(--border-color)");

            // Get mouse coordinates and create the panel next to it
            const [mouseX, mouseY] = d3.pointer(event, document.getElementById("graph-panel"));
            compoundsPanel
                .style("left", (mouseX + 15) + "px") 
                .style("top", (mouseY + 15) + "px")
                .style("bottom", "auto")
                .style("right", "auto");
        });

    // Draw nodes
    const nodeGroup = svg.append("g").attr("class", "nodes");
    const nodes = nodeGroup.selectAll("g")
        .data(graphData.nodes)
        .enter().append("g")
        .attr("transform", d => `translate(${d.x}, ${d.y})`)
        .style("cursor", "pointer")
        .on("click", function(event, d) {
            event.stopPropagation(); 

            // Deselect all edges of the graph
            links.classed("selected-edge", false); 
            d3.select("#compounds-panel").style("display", "none");

            const isSelected = d3.select(this).classed("selected");
            
            // Remove previous selections
            nodeGroup.selectAll("g").classed("selected", false);
            
            if (isSelected) {
                // Deselect => Reset all links
                links.transition().duration(300)
                     .attr("opacity", 0.5)
                     .attr("stroke", "var(--flavor-matcha)");
            } else {
                // Select => Highlight only connected links
                d3.select(this).classed("selected", true);
                links.transition().duration(300)
                     .attr("opacity", link => (link.source === d.id || link.target === d.id) ? 0.9 : 0.05)
                     .attr("stroke", link => (link.source === d.id || link.target === d.id) ? "var(--flavor-mango)" : "var(--flavor-matcha)");
            }
        });

    // Put a circle in front of the ingredient names to connect the edges to
    nodes.append("circle")
        .attr("r", 6)
        .attr("fill", "var(--flavor-strawberry)");

    // Ingredients name pointing outward
    nodes.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.x < 0 ? -10 : 10)
        .attr("text-anchor", d => d.x < 0 ? "end" : "start")
        .attr("transform", d => {
            let rot = (d.angle * 180 / Math.PI) - 90;
            if (d.x < 0) rot += 180; 
            return `rotate(${rot})`;
        })
        .text(d => d.id)
        .style("font-size", "11px")
        .style("fill", "var(--text-dark)");
}

// --- Data management functions --- //
// A function that opens the csv file for the recipes, extract all the countries listed in it and map them to the true name needed to display them on the map
async function initCulturalMap() {
    // Initialize the map visualization
    const width = document.getElementById('map-area').clientWidth || 800;
    const height = document.getElementById('map-area').clientHeight || 800;

    const svg = d3.select("#map-area").append("svg")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g");

    const projection = d3.geoMercator()
        .scale(120)
        .translate([width / 2, height / 1.5]);
    const path = d3.geoPath().projection(projection);

    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });
    svg.call(zoom);

    // Tooltip showing the name of the country and to what region, if in a region, it belongs to
    const tooltip = d3.select("body").append("div")
        .attr("class", "map-tooltip");

    // This tells D3 which countries map to which 'Cuisine' in the CSV
    const countryToCuisine = {
        // North America
        "USA": "USA", "United States of America": "USA", "Canada": "Canada", "Mexico": "Mexico",
        // Central America & Caribbean
        "Guatemala": "Misc.: Central America", "Belize": "Misc.: Central America", "Honduras": "Misc.: Central America", "El Salvador": "Misc.: Central America", "Nicaragua": "Misc.: Central America", "Costa Rica": "Misc.: Central America", "Panama": "Misc.: Central America",
        "Cuba": "Caribbean", "Haiti": "Caribbean", "Dominican Republic": "Caribbean", "Jamaica": "Caribbean", "Bahamas": "Caribbean", "Puerto Rico": "Caribbean",
        // South America
        "Brazil": "South America", "Argentina": "South America", "Colombia": "South America", "Peru": "South America", "Chile": "South America", "Venezuela": "South America", "Ecuador": "South America", "Bolivia": "South America", "Paraguay": "South America", "Uruguay": "South America", "Guyana": "South America", "Suriname": "South America",
        // Europe
        "United Kingdom": "British Isles", "England": "British Isles", "Ireland": "British Isles",
        "Germany": "DACH Countries", "Austria": "DACH Countries", "Switzerland": "DACH Countries",
        "France": "France", "Italy": "Italy", "Spain": "Spain", "Portugal": "Misc.: Portugal", "Greece": "Greece", "Belgium": "Misc.: Belgian", "Netherlands": "Misc.: Dutch",
        "Sweden": "Scandinavia", "Norway": "Scandinavia", "Denmark": "Scandinavia", "Finland": "Scandinavia", "Iceland": "Scandinavia",
        "Russia": "Eastern Europe", "Ukraine": "Eastern Europe", "Poland": "Eastern Europe", "Romania": "Eastern Europe", "Czech Republic": "Eastern Europe", "Hungary": "Eastern Europe", "Belarus": "Eastern Europe", "Bulgaria": "Eastern Europe", "Slovakia": "Eastern Europe",
        // Asia
        "China": "China", "Taiwan": "China", "Japan": "Japan", "South Korea": "Korea", "North Korea": "Korea",
        "India": "Indian Subcontinent", "Pakistan": "Indian Subcontinent", "Bangladesh": "Indian Subcontinent", "Sri Lanka": "Indian Subcontinent", "Nepal": "Indian Subcontinent", "Bhutan": "Indian Subcontinent",
        "Thailand": "Thailand", "Vietnam": "South East Asia", "Malaysia": "South East Asia", "Indonesia": "South East Asia", "Philippines": "South East Asia", "Laos": "South East Asia", "Cambodia": "South East Asia", "Myanmar": "South East Asia",
        "Saudi Arabia": "Middle East", "Iran": "Middle East", "Iraq": "Middle East", "Syria": "Middle East", "Lebanon": "Middle East", "Israel": "Middle East", "Jordan": "Middle East", "United Arab Emirates": "Middle East", "Yemen": "Middle East", "Oman": "Middle East", "Turkey": "Middle East",
        // Oceania
        "Australia": "Australia & NZ", "New Zealand": "Australia & NZ"
    };

    // Add African countries dynamically to keep the list clean (as they are all in the "Africa" region)
    const africanCountries = [
        "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cameroon", 
        "Central African Republic", "Central African Rep.", "Chad", 
        "Democratic Republic of the Congo", "Dem. Rep. Congo", "Republic of the Congo", "Congo",
        "Djibouti", "Egypt", "Equatorial Guinea", "Eq. Guinea", "Eritrea", "Eswatini", "Swaziland", 
        "Ethiopia", "Gabon", "Gambia", "The Gambia", "Ghana", "Guinea", "Guinea-Bissau", 
        "Ivory Coast", "Côte d'Ivoire", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", 
        "Malawi", "Mali", "Mauritania", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", 
        "Rwanda", "Senegal", "Sierra Leone", "Somalia", "Somaliland", "South Africa", 
        "South Sudan", "S. Sudan", "Sudan", "Tanzania", "United Republic of Tanzania", "Togo", 
        "Tunisia", "Uganda", "Zambia", "Zimbabwe", "Western Sahara", "W. Sahara"
    ];
    
    africanCountries.forEach(c => countryToCuisine[c] = "Africa");


    try {
        // Lightweight TopoJSON map
        const topology = await d3.json("https://unpkg.com/world-atlas@2.0.2/countries-110m.json");
        const recipes = await d3.csv("data/01_Recipe_Details.csv");

        // Get unique regions from CSV
        const activeRegions = Array.from(new Set(recipes.map(d => d.Cuisine).filter(d => d)));
        
        // Generates a unique color evenly distributed across the color spectrum
        const colorScale = d3.scaleSequential()
            .domain([0, activeRegions.length])
            .interpolator(d3.interpolateRainbow);

        // Map region name to its generated color
        const regionColors = new Map();
        activeRegions.forEach((region, i) => regionColors.set(region, colorScale(i)));

        const worldFeatures = topojson.feature(topology, topology.objects.countries).features;

        // Colors all countries with the color we attributed to them and manage the mouse interactions with the map
        g.selectAll("path")
            .data(worldFeatures)
            .enter().append("path")
            .attr("d", path)
            .attr("fill", d => {
                const mapCountry = d.properties.name;
                const recipeCuisine = countryToCuisine[mapCountry];
                
                // If the country belongs to a cuisine in the dataset, color it. Otherwise, light grey.
                if (recipeCuisine && regionColors.has(recipeCuisine)) {
                    return regionColors.get(recipeCuisine);
                }
                return "#e2e8f0"; // Inactive countries
            })
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 0.5)
            .style("cursor", d => countryToCuisine[d.properties.name] ? "pointer" : "default")
            // Hover effect to highlight the whole region group
            .on("mouseover", function(event, d) {
                const mapCountry = d.properties.name;
                const hoveredCuisine = countryToCuisine[mapCountry];
                
                if (hoveredCuisine) {
                    // Highlight region
                    g.selectAll("path")
                        .attr("opacity", p => countryToCuisine[p.properties.name] === hoveredCuisine ? 1 : 0.3)
                        .attr("stroke-width", p => countryToCuisine[p.properties.name] === hoveredCuisine ? 1.5 : 0.5);

                    // Clean the name for display (removes "Misc.: " or "Misc: ")
                    const displayCuisine = hoveredCuisine.replace(/^Misc\.?:\s*/, "");

                    // Show and populate tooltip
                    tooltip.html(`<strong>${displayCuisine}</strong><span class="country-name">${mapCountry}</span>`)
                        .style("opacity", 1);
                }
            })
            // Make the tooltip follow the mouse
            .on("mousemove", function(event) {
                tooltip
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            // Remove highlight and hide tooltip
            .on("mouseout", function() {
                g.selectAll("path")
                    .attr("opacity", 1)
                    .attr("stroke-width", 0.5);
                    
                tooltip.style("opacity", 0);
            })
            // Click to Zoom and Show Recipes
            .on("click", function(event, d) {
                const clickedCuisine = countryToCuisine[d.properties.name];
                
                if(clickedCuisine && activeRegions.includes(clickedCuisine)) {
                    // Zoom logic
                    const bounds = path.bounds(d);
                    const dx = bounds[1][0] - bounds[0][0];
                    const dy = bounds[1][1] - bounds[0][1];
                    const x = (bounds[0][0] + bounds[1][0]) / 2;
                    const y = (bounds[0][1] + bounds[1][1]) / 2;
                    const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
                    const translate = [width / 2 - scale * x, height / 2 - scale * y];

                    svg.transition().duration(750).call(
                        zoom.transform, 
                        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
                    );

                    // Open the Recipe Panel for the matched Cuisine group!
                    showRecipesForRegion(clickedCuisine, recipes);
                }
            });

    } catch (error) {
        console.error("Error loading map data:", error);
    }
}

// Global Lookup Maps for instant access
let recipeIngredientsMap = new Map(); 
let ingredientCompoundsMap = new Map();

// Load the recipes before hand so that it has fast access
async function loadDataForViz2() {
    try {
        // Load the Recipe-Ingredient Mapping
        const recipeIngredients = await d3.csv("data/04_Recipe-Ingredients_Aliases.csv");
        
        // Group ingredients by Recipe ID
        recipeIngredients.forEach(row => {
            const recipeId = row["Recipe ID"];
            
            // normalize the name => lowercase and remove trailing spaces
            let originalName = row["Aliased Ingredient Name"].trim().toLowerCase();
            
            // check the dictionary for a match. If none, keep the original name.
            let mappedName = ingredientMapping[originalName] || originalName;
            
            // use the custom dictionnary to add missing ingredients to compounds mappings
            const ingredientName = mappedName.replace(/_/g, ' ');

            if (!recipeIngredientsMap.has(recipeId)) {
                recipeIngredientsMap.set(recipeId, []);
            }
            // Use the normalized string name as the universal ID
            recipeIngredientsMap.get(recipeId).push({
                name: row["Aliased Ingredient Name"].trim(), // Keep original capitalization for display
                id: ingredientName // Use normalized string as the join key
            });
        });

        // Load Compounds and Ingredient Info from TSVs
        const ingrInfo = await d3.tsv("data/ingr_info.tsv");
        const ingrComp = await d3.tsv("data/ingr_comp.tsv");
        const compInfo = await d3.tsv("data/comp_info.tsv");
        
        const compIdToName = new Map(compInfo.map(d => [d["# id"], d["Compound name"].replace(/_/g, ' ')]));
        
        // Create a dictionary to map the TSV's arbitrary number ID to its string name
        const tsvIdToName = new Map(ingrInfo.map(d => [d["# id"], d["ingredient name"].replace(/_/g, ' ').trim().toLowerCase()]));

        // Group compounds by the normalized ingredient name instead of the ID number
        ingrComp.forEach(row => {
            const tsvIngrId = row["# ingredient id"];
            const compId = row["compound id"];
            
            // Translate the arbitrary TSV ID into the string name (e.g., ID 58 -> "butter")
            const ingrName = tsvIdToName.get(tsvIngrId);
            const compName = compIdToName.get(compId) || compId; // Safety check: use comound id if we couldn't find the name associated to it

            if (ingrName) {
                // Each ingredient maps to its set of compounds
                if (!ingredientCompoundsMap.has(ingrName)) {
                    ingredientCompoundsMap.set(ingrName, new Set());
                }
                ingredientCompoundsMap.get(ingrName).add(compName);
            }
        });

        console.log("Viz 2 Data pre-processed successfully");

    } catch (error) {
        console.error("Error loading Viz 2 data:", error);
    }
}

// --- Helper functions --- //
// Extract all the ingredients from a recipe, associate compounds to it and create the shared compounds lists for the edges of the graph
function calculateSharedCompounds(recipe) {
    const recipeId = recipe["Recipe ID"];
    
    // Get ingredients for this specific recipe from pre-processed map or an empty map
    const ingredients = recipeIngredientsMap.get(recipeId) || [];
    
    const nodes = [];
    const links = [];
    
    // Format Nodes
    const uniqueIngredients = [];
    const seen = new Set();
    // Remove duplicates in case some ingredients were put multiple times
    ingredients.forEach(ing => {
        if (!seen.has(ing.id)) {
            seen.add(ing.id);
            uniqueIngredients.push(ing);
            nodes.push({ id: ing.name, entityId: ing.id });
        }
    });

    let maxShared = 0;

    // Compare every ingredient's compounds to every other ingredient's
    for (let i = 0; i < uniqueIngredients.length; i++) {
        for (let j = i + 1; j < uniqueIngredients.length; j++) {
            const ingA = uniqueIngredients[i];
            const ingB = uniqueIngredients[j];

            // Grab the compounds sets for both ingredients
            const compA = ingredientCompoundsMap.get(ingA.id) || new Set();
            const compB = ingredientCompoundsMap.get(ingB.id) || new Set();

            // List of the compounds they share
            const shared = [...compA].filter(c => compB.has(c));

            if (shared.length > 0) {
                // Find the best match to represent the thickness of the dges depending on this number
                if (shared.length > maxShared) maxShared = shared.length;
                
                links.push({
                    source: ingA.name,
                    target: ingB.name,
                    sharedCount: shared.length,
                    compounds: shared
                });
            }
        }
    }

    // We attach the maxShared value to every link so D3 knows how to calculate the percentage for thickness
    links.forEach(l => l.maxShared = maxShared);

    return { nodes, links };
}

// Helper function to physically draw the list items
function renderRecipeList(recipesToRender) {
    const ul = d3.select("#recipe-list");
    ul.selectAll("*").remove();

    if (recipesToRender.length === 0) {
        ul.append("li")
          .style("color", "#747d8c")
          .text("No matching recipes found.");
        return;
    }

    ul.selectAll("li")
        .data(recipesToRender)
        .enter().append("li")
        .style("padding", "0.75rem")
        .style("margin-bottom", "0.5rem")
        .style("background", "var(--panel-bg)")
        .style("border", "1px solid var(--border-color)")
        .style("border-radius", "6px")
        .style("cursor", "pointer")
        .style("transition", "border-color 0.2s ease")
        .text(d => d.Title)
        .on("mouseover", function() { d3.select(this).style("border-color", "var(--flavor-mango)"); })
        .on("mouseout", function() { d3.select(this).style("border-color", "var(--border-color)"); })
        .on("click", (event, d) => buildCircularGraph(d));
}

let currentRegionRecipes = [];

// Setup the panel and the search bar
function showRecipesForRegion(regionName, allRecipes) {
    // Store all recipes for this region
    currentRegionRecipes = allRecipes.filter(r => r.Cuisine === regionName);

    // Hide the graph and compound panel and display the recipe choosing panel
    d3.select("#graph-panel").style("display", "none");
    d3.select("#compounds-panel").style("display", "none");
    d3.select("#recipe-list-panel").style("display", "block");

    // Clean the name for display
    const displayRegion = regionName.replace(/^Misc\.?:\s*/, "");
    d3.select("#region-title").text(`${displayRegion} Recipes`);

    // Reset the search bar
    const searchInput = document.getElementById("recipe-search");
    if (searchInput) searchInput.value = "";

    // Show a random selection of 7 recipes to start
    const shuffled = [...currentRegionRecipes].sort(() => 0.5 - Math.random());
    renderRecipeList(shuffled.slice(0, 7));

    // Activate the search bar so that it filters the list as the user writes in it
    d3.select("#recipe-search").on("input", function() {
        const searchTerm = this.value.toLowerCase();
        
        if (searchTerm === "") {
            // If empty, show the default 7
            renderRecipeList(shuffled.slice(0, 7));
        } else {
            // Filter all recipes in the region by the typed text
            const filtered = currentRegionRecipes.filter(r => r.Title.toLowerCase().includes(searchTerm));
            renderRecipeList(filtered.slice(0, 15)); // Limit to 15 results so it doesn't overflow massively
        }
    });
}