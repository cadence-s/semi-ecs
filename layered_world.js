/**
 * A world consisting of layers of entities.
 */
export class LayeredWorld {
    #layers;

    /**
     * @param {Map<string, object>} components 
     */
    constructor(components) {
        this.components = components;
        this.#layers = new Map();
    }

    /**
     * Create a new entity in the world.
     * @param {*} layer The layer to place the new entity in.
     * @param {Map<string, object>} components The components that make up the entity.
     */
    createEntity(layer, components) {
        this.#pokeLayer();
        this.#layers.get(layer).add(new Entity(layer, components));
    }

    /**
     * Permanently remove an entity from the world.
     * @param {*} entity 
     */
    destroyEntity(entity) {
        this.#layers.get(entity._layer).delete(entity);
    }

    /**
     * Execute a function for each entity in the world.
     * @param {(entity: Entity) => void} fn
     */
    forEachEntity(fn) {
        this.#layers.values().forEach((layer) => {
            layer.forEach(fn);
        });
    }

    /**
     * Execute a function for each entity in a layer.
     * @param {*} layer 
     * @param {(entity: Entity) => void} fn 
     */
    forEachEntityIn(layer, fn) {
        this.#layers.get(layer).forEach(fn);
    }

    #pokeLayer(layer) {
        if (!this.#layers.has(layer)) {
            this.#layers.set(layer, new Set());
        }
    }
}

/**
 * An entity in a LayeredWorld.
 */
class Entity {
    /**
     * Do not use this constructor. Instead, create entities in a world with createEntity().
     * @param {*} layer 
     * @param {Map<string, object>} components 
     */
    constructor(layer, components) {
        this._layer = layer;
        Object.assign(this, components);
    }

    /**
     * Check if the entity has a component.
     * @param {*} component 
     * @returns {boolean}
     */
    has(component) {
        return this.hasOwnProperty(component);
    }
}
