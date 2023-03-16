
/*

*/

/**
 * [bar description]
 * @param  {Feature} feature A GeoJSON Feature
 * @return {Status}     A status object that describes whether it works
 */
const handleFeatureCreation = (feature, mapId) => placeHolderFunction(feature, mapId)// sends Feature to Firestore

/**
 * [bar description]
 * @param  {string} featureId A GeoJSON Feature
 * @param  {string} mapId A GeoJSON Feature
 * @param  {string} featureUpdatePath e.g properties.color
 * @param  {object} featureUpdateValue e.g blue
 * @return {Status}     A status object that describes whether it works
 */
const handleFeatureUpdate = (featureId, mapId, featureUpdatePath, featureUpdateValue) => {
    db.document(`maps/{mapId}/features/{featureId}`).update({featureUpdatePath: featureUpdateValue})
}

const handleFeatureDelete = (featureId, mapId) => placeHolderFunction(featureId, mapId)// sends Feature to Firestore

const streamFeatures = () => {
    // Make it aware of the viewState
    // Make it aware of the source.featureFilter
}