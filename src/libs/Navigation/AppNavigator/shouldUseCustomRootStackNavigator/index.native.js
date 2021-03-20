import {Dimensions} from 'react-native';
import variables from '../../../../styles/variables';

// On native platforms we only switch to the custom navigator when the screen width is large.
// react-navigation isn't yet configured for wider screens.
export default Dimensions.get('window').width > variables.mobileResponsiveWidthBreakpoint;
