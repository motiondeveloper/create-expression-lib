{
    fromOtherFile: 'value in another file',

    // Importing object bases (CompBase, LayerBase, PropertyBase)
    // Creating a new composition object from CompBase
    // Using the expression types in a function
    getLayerDuration(layerName) {
        const layer = thisComp.layer(layerName);
        return layer.outPoint - layer.inPoint;
    },
    // Using expressions global functions
    remap(value) {
        return thisLayer.linear(value, 0, 10, 0, 1);
    },
    welcome(name) {
        return `Welcome ${name}!`;
    },
    someValue: 2,
    version: '1.0.0',
}