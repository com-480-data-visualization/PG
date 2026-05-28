// viz2.js
import { countryToCuisine, africanCountries } from './mappings.js';
import { recipeIngredientsMap, ingredientCompoundsMap } from './sharedData.js';

let currentRegionRecipes = [];

export async function initCulturalMap() {
   // A function that opens the csv file for the recipes, extract all the countries listed in it and map them to the true name needed to display them on the map
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
                return "#e2e8f0"; 
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
                    tooltip.html(`<strong>${displayCuisine}</strong><br><span class="country-name">${mapCountry}</span>`)
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
                    
                    // Shift the center slightly to the left to account for the right-side panel
                    const translate = [(width / 2) - 175 - scale * x, height / 2 - scale * y];

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
    setupViz2UI();
}

function setupViz2UI() {
    // Re-purposed to just close the graph, leaving the recipes panel open
    document.getElementById("back-to-recipes").innerText = "× Close Graph";
    document.getElementById("back-to-recipes")?.addEventListener("click", () => {
        d3.select("#graph-panel").style("display", "none");
        d3.select("#compounds-panel").style("display", "none");
    });

    // Manage closing the compound panel
    document.getElementById("close-compounds")?.addEventListener("click", (event) => {
        event.stopPropagation(); 
        const compoundsPanel = d3.select("#compounds-panel");
        compoundsPanel.style("display", "none");
        
        const links = d3.selectAll(".links path").classed("selected-edge", false);
        const selectedNode = d3.select(".nodes g.selected");
        
        if (selectedNode.empty()) {
            links.transition().duration(300)
                 .attr("stroke", function() { return d3.select(this).attr("data-color"); })
                 .attr("opacity", 0.6);
        } else {
            const nodeData = selectedNode.datum();
            links.transition().duration(300)
                 .attr("opacity", link => (link.source === nodeData.id || link.target === nodeData.id) ? 1 : 0.05)
                 .attr("stroke", function(link) { 
                     return (link.source === nodeData.id || link.target === nodeData.id) 
                         ? d3.select(this).attr("data-color") 
                         : "#e2e8f0"; 
                 });
        }
    });

    document.getElementById("compounds-panel")?.addEventListener("click", (event) => event.stopPropagation());

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
                     .attr("opacity", 0.6)
                     .attr("stroke", function() { return d3.select(this).attr("data-color"); });
            } else {
                const nodeData = selectedNode.datum();
                links.transition().duration(300)
                     .attr("opacity", link => (link.source === nodeData.id || link.target === nodeData.id) ? 1 : 0.05)
                     .attr("stroke", function(link) { 
                        return (link.source === nodeData.id || link.target === nodeData.id) 
                            ? d3.select(this).attr("data-color") 
                            : "#e2e8f0"; 
                    });
            }
        } else { // If no compound panel is open and we click outside of the selected edge
            // If a user clicks outside (meaning not an ingredient or an edge) of the currently highlighted graph, go back to default (deselect ingredient)
            d3.selectAll(".nodes g").classed("selected", false);
            links.transition().duration(300)
                 .attr("opacity", 0.6)
                 .attr("stroke", function() { return d3.select(this).attr("data-color"); });
        }
    });
}

function buildCircularGraph(recipe) {
    // Hide the recipe list panel and the compound panel at first and show the graph
    d3.select("#compounds-panel").style("display", "none");
    d3.select("#graph-panel").style("display", "flex"); 
    d3.select("#recipe-title").text(recipe.Title);

    // If there was a circular graph before => remove it before building the new one
    const container = d3.select("#circular-graph");
    container.selectAll("*").remove(); 
    
    // Get the container size
    const containerWidth = container.node().clientWidth || 800;
    const containerHeight = container.node().clientHeight || 800;
    
    const size = Math.min(containerWidth, containerHeight, 650);
    // Calculate dimensions
    const width = size;
    const height = size;
    const radius = (size / 2) - 130;

    // Create Base SVG
    const svgBase = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    // Center the origin in the exact middle of the SVG
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

    // Dynamic color scale based on max compounds shared
    const maxSharedGlobal = graphData.links.length > 0 ? graphData.links[0].maxShared : 1;
    const edgeColorScale = d3.scaleSequential(d3.interpolateTurbo)
        .domain([1, maxSharedGlobal]);

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
        .attr("stroke", d => edgeColorScale(d.sharedCount))
        .attr("data-color", d => edgeColorScale(d.sharedCount)) // Store base color
        .attr("stroke-width", d => Math.max(1.5, (d.sharedCount / d.maxShared) * 8))
        .attr("opacity", 0.6)
        .style("cursor", "pointer")
        .on("mouseover", function() { 
            d3.select(this)
              .attr("opacity", 1)
              .attr("stroke-width", d => Math.max(3, (d.sharedCount / d.maxShared) * 12)); 
        }) 
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
                selection.attr("stroke", "#e2e8f0").attr("opacity", 0.1);
            } 
            else if (isAnyNodeSelected) {
                // If an ingredient is selected, check if this edge belongs to it and adapt opacity accordingly
                const nodeData = selectedNode.datum();
                const isConnected = (d.source === nodeData.id || d.target === nodeData.id);
                
                selection.attr("stroke", isConnected ? selection.attr("data-color") : "#e2e8f0")
                         .attr("opacity", isConnected ? 1 : 0.05);
            } 
            else {
                // Normal state: no panel open, no ingredient selected
                selection.attr("stroke", selection.attr("data-color"))
                         .attr("stroke-width", Math.max(1.5, (d.sharedCount / d.maxShared) * 8))
                         .attr("opacity", 0.6);
            }
        })
        .on("click", function(event, d) {
            event.stopPropagation(); 

            // Deselect and put all edges in the background by lowering the opacity
            links.classed("selected-edge", false)
                 .attr("stroke", "#e2e8f0")
                 .attr("opacity", 0.1);

            // Bring forth the edfe on which the user clicked by increasing its opacity
            d3.select(this).classed("selected-edge", true)
                .attr("stroke", d3.select(this).attr("data-color"))
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
                .style("padding", "5px 0")
                .style("border-bottom", "1px solid rgba(0,0,0,0.05)");

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
                     .attr("opacity", 0.6)
                     .attr("stroke", function() { return d3.select(this).attr("data-color"); });
            } else {
                // Select => Highlight only connected links
                d3.select(this).classed("selected", true);
                links.transition().duration(300)
                     .attr("opacity", link => (link.source === d.id || link.target === d.id) ? 1 : 0.05)
                     .attr("stroke", function(link) { 
                        return (link.source === d.id || link.target === d.id) 
                            ? d3.select(this).attr("data-color") 
                            : "#e2e8f0"; 
                    });
            }
        });

    // Put a circle in front of the ingredient names to connect the edges to
    nodes.append("circle")
        .attr("r", 6)
        .attr("fill", "var(--text-dark)")
        .attr("stroke", "white")
        .attr("stroke-width", 2);

    // Ingredients name pointing outward
    nodes.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.x < 0 ? -12 : 12)
        .attr("text-anchor", d => d.x < 0 ? "end" : "start")
        .attr("transform", d => {
            let rot = (d.angle * 180 / Math.PI) - 90;
            if (d.x < 0) rot += 180; 
            return `rotate(${rot})`;
        })
        .text(d => d.id)
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", "var(--text-dark)");
}

// Extract all the ingredients from a recipe, associate compounds to it and create the shared compounds lists for the edges of the graph
function calculateSharedCompounds(recipe) {
    const recipeId = recipe["Recipe ID"];

    // Get ingredients for this specific recipe from pre-processed map or an empty map
    const ingredients = recipeIngredientsMap.get(recipeId) || [];

    const nodes = [];
    const links = [];
    
    // Fromat Nodes
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

            const compA = ingredientCompoundsMap.get(ingA.id) || new Set();
            const compB = ingredientCompoundsMap.get(ingB.id) || new Set();

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
        .style("padding", "0.8rem")
        .style("margin-bottom", "0.6rem")
        .style("background", "rgba(255, 255, 255, 0.9)")
        .style("border", "1px solid rgba(0,0,0,0.05)")
        .style("border-radius", "8px")
        .style("cursor", "pointer")
        .style("transition", "all 0.2s ease")
        .style("font-weight", "600")
        .text(d => d.Title)
        .on("mouseover", function() { 
            d3.select(this)
              .style("border-color", "var(--flavor-mango)")
              .style("transform", "translateX(-3px)"); 
        })
        .on("mouseout", function() { 
            d3.select(this)
              .style("border-color", "rgba(0,0,0,0.05)")
              .style("transform", "none"); 
        })
        .on("click", (event, d) => buildCircularGraph(d));
}

// Setup the panel and the search bar
function showRecipesForRegion(regionName, allRecipes) {
    // Store all recipes for this region
    currentRegionRecipes = allRecipes.filter(r => r.Cuisine === regionName);

    // Show the right-side recipe panel
    d3.select("#recipes-area").style("display", "flex");
    d3.select("#recipe-list-panel").style("display", "flex");
    
    // Hide the graph and compound panel
    d3.select("#graph-panel").style("display", "none");
    d3.select("#compounds-panel").style("display", "none");

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