/**
 * A world consisting of layers of entities.
 */
export class LayeredWorld {
    #layers;
    #nextLayers;

    constructor() {
        this.#layers = new Map();
        this.#nextLayers = new Map();
    }

    /**
     * Create a new entity in the world.
     * @param {*} layer The layer to place the new entity in.
     * @param {Map<string, object>} components The components that make up the entity.
     */
    createEntity(layer, components) {
        this.#pokeLayer(layer);
        this.#nextLayers.get(layer).add(new Entity(layer, components));
    }

    /**
     * Permanently remove an entity from the world.
     * @param {*} entity
     */
    destroyEntity(entity) {
        this.#nextLayers.get(entity._layer).delete(entity);
    }

    /**
     * Moves an entity to a different layer.
     * @param {Entity} entity
     * @param {*} targetLayer
     */
    moveEntity(entity, targetLayer) {
        this.#pokeLayer(targetLayer);
        this.destroyEntity(entity);
        entity._layer = targetLayer;
        this.#nextLayers.get(targetLayer).add(entity);
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

    /**
     * Apply all changes to the world and its entities.
     * 
     * Use this at the end of a processing frame.
     */
    applyChanges() {
        this.#layers = this.#nextLayers;
        this.forEachEntity((entity) => {
            entity.applyChanges();
        });
    }

    #pokeLayer(layer) {
        if (!this.#nextLayers.has(layer)) {
            this.#nextLayers.set(layer, new Set());
        }
    }
}

/**
 * An entity in a LayeredWorld.
 */
class Entity {
    /**
     * The layer this entity is in. Do not write to this property.
     * @readonly
     */
    _layer;

    #components;
    #nextComponents;

    /**
     * Do not use this constructor. Instead, create entities in a world with LayeredWorld.createEntity().
     * @param {*} layer
     * @param {Map<string, object>} components
     */
    constructor(layer, components) {
        this._layer = layer;
        this.#components = null;
        this.#nextComponents = components;
    }

    /**
     * Check if the entity has a component.
     * @param {string} component
     * @returns {boolean}
     */
    has(component) {
        return this.#components.hasOwnProperty(component);
    }

    /**
     * Add a component to the entity.
     * @param {string} component
     */
    add(component) {
        this.#nextComponents[component] = null;
    }

    /**
     * Remove a component from the entity.
     * @param {string} component
     */
    remove(component) {
        delete this.#nextComponents[component];
    }

    /**
     * Get a property of a component in the entity.
     * @param {string} component
     * @param {string} property
     * @returns {*}
     */
    get(component, property) {
        return this.#components[component][property];
    }

    /**
     * Set a property of a component in the entity.
     * @param {string} component
     * @param {string} property
     * @param {*} value
     */
    set(component, property, value) {
        this.#nextComponents[component][property] = value;
    }

    /**
     * Apply all changes to the entity.
     * 
     * Prefer using LayeredWorld.applyChanges() rather than this method.
     */
    applyChanges() {
        this.#components = this.#nextComponents;
    }
}
