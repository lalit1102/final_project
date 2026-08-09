/**
 * Returns the base Ant Design theme configuration.
 * Uses Ant Design design tokens — no hardcoded color systems.
 *
 * The provider applying this config owns the responsibility of
 * selecting the algorithm (light/dark) via getThemeAlgorithm().
 */
export const getAntdThemeConfig = () => {
    return {
        token: {
            borderRadius: 8,
            fontSize: 14,
        },
        components: {},
    };
};
