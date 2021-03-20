import _ from 'underscore';
import React from 'react';
import {View} from 'react-native';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import {createNavigatorFactory, useNavigationBuilder} from '@react-navigation/core';
import {StackRouter} from '@react-navigation/routers';
import Modal from '../../../components/Modal';
import themeColors from '../../../styles/themes/default';
import ONYXKEYS from '../../../ONYXKEYS';
import Navigation from '../Navigation';
import compose from '../../compose';
import CONST from '../../../CONST';
import styles from '../../../styles/styles';

const propTypes = {
    // Navigation state for this navigator
    // See: https://reactnavigation.org/docs/navigation-state/
    state: PropTypes.shape({
        // Index of the focused route object in the routes array
        index: PropTypes.number,

        // List of route objects (screens) which are rendered in the navigator. It also represents the history in a
        // stack navigator. There should be at least one item present in this array.
        routes: PropTypes.arrayOf(PropTypes.shape({

            // A unique key name for a screen. Created automatically by react-nav.
            key: PropTypes.string,
        })),
    }).isRequired,

    // Object containing descriptors for each route with the route keys as its properties
    // See: https://reactnavigation.org/docs/custom-navigators/#usenavigationbuilder
    // eslint-disable-next-line react/no-unused-prop-types
    descriptors: PropTypes.objectOf(PropTypes.shape({

        // A function which can be used to render the actual screen. Calling descriptors[route.key].render() will return
        // a React element containing the screen content.
        render: PropTypes.func,
    })).isRequired,

    modalPaths: PropTypes.arrayOf(PropTypes.string).isRequired,

    // Current url we are navigated to
    currentURL: PropTypes.string,
};

const defaultProps = {
    currentURL: '',
};

/**
 * Returns the current descriptor key for the focused screen in this navigators state. The descriptor has a function
 * called render() that we must call each time this navigator updates.
 *
 * @param {Object} props
 * @returns {Object}
 */
function getCurrentRouteDescriptorKey(props) {
    const currentRoute = props.state.routes[props.state.index];
    return currentRoute.key;
}

const ResponsiveView = (props) => {
    // Every descriptor in the navigation tree MUST render otherwise navigation tree gets screwed up.
    // Modals on larger screens or web must always be rendered except we only really need the current view to display
    // inside the modal not any views that are underneath the top Modal view. This works differently when we are on
    // iOS and Android with small screen width since we will use the react-navigation modals instead.
    const mainRoute = _.find(props.descriptors, descriptor => descriptor.options.isMainRoute);
    const modalRoutes = _.filter(props.descriptors, (descriptor, key) => (

        // We want all of the modal routes as long as it's not the current modal route since this should be rendered
        // inside the modal itself.
        descriptor.options.isModalRoute
            && getCurrentRouteDescriptorKey(props) !== key
    ));
    const currentModalRoute = _.find(props.descriptors, (descriptor, key) => (
        descriptor.options.isModalRoute
            && getCurrentRouteDescriptorKey(props) === key
    ));

    const renderedModalScreen = currentModalRoute && currentModalRoute.render();
    return (
        <>
            {mainRoute.render()}
            <View style={styles.dNone}>
                {_.map(modalRoutes, modalRoute => modalRoute.render())}
                {renderedModalScreen}
            </View>
            {_.map(props.modalPaths, modalPath => (
                <Modal
                    key={`modal_${modalPath}`}
                    isVisible={props.currentURL.slice(1).startsWith(modalPath)}
                    backgroundColor={themeColors.componentBG}
                    type={CONST.MODAL.MODAL_TYPE.RIGHT_DOCKED}
                    onClose={Navigation.dismissModal}
                >
                    {renderedModalScreen || <View />}
                </Modal>
            ))}
        </>
    );
};

ResponsiveView.propTypes = propTypes;
ResponsiveView.defaultProps = defaultProps;
ResponsiveView.displayName = 'ResponsiveView';

const ResponsiveViewWithHOCs = compose(
    withOnyx({
        currentURL: {
            key: ONYXKEYS.CURRENT_URL,
        },
    }),
)(ResponsiveView);

const ResponsiveNavigator = ({
    children,
    ...rest
}) => {
    const {state, navigation, descriptors} = useNavigationBuilder(StackRouter, {
        children,
    });

    return (
        <ResponsiveViewWithHOCs
            state={state}
            navigation={navigation}
            descriptors={descriptors}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...rest}
        />
    );
};

ResponsiveNavigator.propTypes = {
    children: PropTypes.node.isRequired,
};

export default createNavigatorFactory(ResponsiveNavigator);
