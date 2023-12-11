/**
 * A world consisting of layers of entities.
 */
export class LayeredWorld {
    /**
     * The total number of entities in the world.
     * @readonly
     */
    entityCount = 0;

    #componentPool;
    #layers = new Map();
    #nextLayers = new Map();
    #nextEntityCount = 0;

    /**
     * @param {ComponentMap} componentPool All the components that exist in the world, with default property values.
     */
    constructor(componentPool) {
        this.#componentPool = componentPool;
    }

    /**
     * Create a new entity in the world.
     * @param {*} layer The layer to place the new entity in.
     * @returns {Entity} The newly created entity.
     */
    createEntity(layer) {
        let entity = new Entity(layer, this.#componentPool);
        this.#pokeLayer(layer);
        this.#nextLayers.get(layer).add(entity);
        this.#nextEntityCount++;
        return entity
    }

    /**
     * Permanently remove an entity from the world.
     * @param {Entity} entity
     */
    destroyEntity(entity) {
        this.#nextLayers.get(entity.layer).delete(entity);
        entity._nextLayer = null;
        this.#nextEntityCount--;
    }

    /**
     * Moves an entity to a different layer.
     * @param {Entity} entity
     * @param {*} targetLayer
     */
    moveEntity(entity, targetLayer) {
        this.#pokeLayer(targetLayer);
        this.destroyEntity(entity);
        entity._nextLayer = targetLayer;
        this.#nextLayers.get(targetLayer).add(entity);
        this.#nextEntityCount++;
    }

    /**
     * Execute a function for each entity in the world.
     * @param {(entity: Entity) => void} fn
     */
    forEachEntity(fn) {
        this.#layers.forEach((layer) => {
            layer.forEach(fn);
        });
    }

    /**
     * Execute a function for each entity in the given layers.
     * @param {(entity: Entity) => void} fn
     * @param {...*} layers 
     */
    forEachEntityIn(fn, ...layers) {
        layers.forEach((layer) => {
            if (this.#layers.has(layer)) {
                this.#layers.get(layer).forEach(fn);
            }
        });
    }

    /**
     * Apply all changes to the world and its entities.
     * 
     * Use this at the end of a processing frame.
     */
    applyChanges() {
        this.#layers = this.#nextLayers;
        this.#nextLayers = new Map();
        this.#layers.forEach((v, k) => {
            let newSet = new Set();
            v.forEach((entity) => {
                entity.applyChanges();
                newSet.add(entity);
            })
            this.#nextLayers.set(k, newSet);
        })
        this.entityCount = this.#nextEntityCount;
    }

    #pokeLayer(layer) {
        if (!this.#nextLayers.has(layer)) {
            this.#nextLayers.set(layer, new Set());
        }
    }
}

/**
 * A mapping of components with associated properties.
 */
export class ComponentMap extends Map {
    /**
     * @param {object} obj An object to build a ComponentMap from.
     */
    static fromObj(obj) {
        let componentMap = new ComponentMap();
        Object.entries(obj).forEach(([component, properties]) => {
            if (typeof properties !== 'object') {
                throw new Error(`Component "${component}" contains type "${typeof properties}" instead of object`);
            }
            if (properties === null) {
                properties = new Map();
            } else {
                componentMap.set(component, new Map(Object.entries(properties)));
            }
        });
        return componentMap;
    }
}

/**
 * An entity in a LayeredWorld.
 */
class Entity {
    /**
     * The layer the entity is in.
     * @readonly
     */
    layer = null;
    /**
     * The layer the entity will be in after changes are applied.
     * 
     * Avoid using this property. Instead, applyChanges() and use Entity.layer.
     * @readonly
     */
    _nextLayer;

    #componentPool;
    #components = new ComponentMap();
    #nextComponents = new ComponentMap();

    /**
     * Do not use this constructor. Instead, create entities in a world with LayeredWorld.createEntity().
     * @param {*} layer
     * @param {ComponentMap} componentPool
     */
    constructor(layer, componentPool) {
        this._nextLayer = layer;
        this.#componentPool = componentPool;
    }

    /**
     * Check if the entity has a component.
     * @param {string} component
     * @returns {boolean}
     */
    has(component) {
        return this.#components.has(component);
    }

    /**
     * Merge all components from a ComponentMap into the entity.
     * @param {ComponentMap} componentMap
     */
    merge(componentMap) {
        componentMap.forEach((properties, component) => {
            this.#validateComponentInPool(component);
            this.#nextComponents.set(component, properties);
        });
    }

    /**
     * Add components with default properties to the entity.
     * @param {string} components
     */
    add(...components) {
        components.forEach((component) => {
            this.#validateComponentInPool(component);
            this.#nextComponents.set(component, new Map());
        });
    }

    /**
     * Remove components from the entity.
     * @param {...string} components
     */
    remove(...components) {
        components.forEach((component) => {
            this.#validateComponentInEntity(component);
            this.#nextComponents.delete(component);
        });
    }

    /**
     * Get a property of a component in the entity.
     * @param {string} component
     * @param {string} property
     * @returns {*}
     */
    get(component, property) {
        this.#validateComponentInEntity(component);
        this.#validateProperty(component, property);
        let propertyMap = this.#components.get(component);
        if (propertyMap.has(property)) {
            return propertyMap.get(property);
        } else {
            return this.#componentPool.get(component).get(property);
        }
    }

    /**
     * Set a property of a component in the entity.
     * @param {string} component
     * @param {string} property
     * @param {*} value
     */
    set(component, property, value) {
        this.#validateComponentInEntity(component);
        this.#validateProperty(component, property);
        this.#nextComponents.get(component).set(property, value);
    }

    /**
     * Apply all changes to the entity.
     * 
     * Prefer using LayeredWorld.applyChanges() rather than this method.
     */
    applyChanges() {
        this.layer = this._nextLayer;
        this.#components = this.#nextComponents;
        this.#nextComponents = new Map();
        this.#components.forEach((propertyMap, component) => {
            this.#nextComponents.set(component, new Map(propertyMap));
        });
    }

    /**
     * @param {string} component
     */
    #validateComponentInPool(component) {
        if (!this.#componentPool.has(component)) {
            throw new Error(`Component "${component}" is not in world's component pool`);
        }
    }

    /**
     * @param {string} component
     */
    #validateComponentInEntity(component) {
        if (!this.#components.has(component)) {
            throw new Error(`Component "${component}" is not in entity`);
        }
    }

    /**
     * @param {string} component
     * @param {string} property
     */
    #validateProperty(component, property) {
        if (!this.#componentPool.get(component).has(property)) {
            throw new Error(`Component "${component}" does not have property "${property}"`);
        }
    }
}
