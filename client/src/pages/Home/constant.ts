/**
 * Constant values used across the client application, aligned with server constants
 * Including pictures path, health statuses, thresholds
 */

// Resource Level Constants
export const RESOURCE_MAX_LEVEL = 100;
export const RESOURCE_MIN_LEVEL = 0;
export const RESOURCE_DEFAULT_LEVEL = 100;

// Resource Types
export const RESOURCE_WATER = "Water";
export const RESOURCE_EARTH = "Earth";
export const RESOURCE_SUN = "Sun";
export const RESOURCE_NONE = "None";
export const RESOURCE_ALL = "All";

// Tree Health Statuses
export const HEALTH_DEAD = "Dead";
export const HEALTH_WITHERED = "Withered";
export const HEALTH_UNHEALTHY = "Unhealthy";
export const HEALTH_HEALTHY = "Healthy";

// Tree Health Thresholds
// >= 70: Healthy tree
// >= 40: Typical/Unhealthy tree
// < 40: Withered/Dry tree (May be updated)
export const TREE_HEALTH_THRESHOLD = 70;    
export const TREE_UNHEALTHY_THRESHOLD = 40;   

// Tree Image Paths
export const TREE_IMAGES = {
    HEALTHY: '/assets/tree_healthy.svg',      // HEALTH_HEALTHY
    UNHEALTHY: '/assets/tree_unhealthy.svg',  // HEALTH_UNHEALTHY
    WITHERED: '/assets/tree_withered.svg',    // HEALTH_WITHERED
    DEAD: '/assets/tree_withered.svg'             // HEALTH_DEAD
};

// Earth Health Thresholds (based on earth level)
// >= 70: Healthy earth
// >= 40: Typical/Unhealthy earth
// < 40: Withered/Dry earth
export const EARTH_HEALTH_THRESHOLD = 70;    
export const EARTH_UNHEALTHY_THRESHOLD = 40;  

// Earth Image Paths
export const EARTH_IMAGES = {
    HEALTHY: '/assets/soil_healthy.svg',      // Earth >= 75
    UNHEALTHY: '/assets/soil_unhealthy.svg',     // Earth >= 45
    WITHERED: '/assets/soil_withered.svg'              // Earth < 45
};


// Water Can
export const WATER_CAN_IMAGE = '/assets/water_can.svg';

// Resource Board
export const RESOURCE_BOARD_BG = '/assets/board2.svg';

// Resource Icons
export const RESOURCE_ICONS = {
    WATER: '/assets/progress_bar_water_icon.svg',
    EARTH: '/assets/progress_bar_earth_icon.svg',
    SUN: '/assets/progress_bar_sun_icon.svg'
};

// Background Images
export const BACKGROUND_IMAGES = "/assets/bg.svg";