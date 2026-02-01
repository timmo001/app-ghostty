ARG BUILD_FROM=ghcr.io/hassio-addons/debian-base:9.2.0
# hadolint ignore=DL3006
FROM ${BUILD_FROM}

# Set shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install requirements for app
ARG BUILD_ARCH=amd64
ARG HA_CLI_VERSION="4.45.0"
ARG NODE_MAJOR=20

# Install Node.js and other dependencies
RUN \
    apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        nodejs \
        nginx \
        bash-completion \
        zsh \
        vim \
        htop \
        git \
        nano \
        tmux \
        wget \
        net-tools \
        procps \
        fzf \
        bat \
        fd-find \
        ripgrep \
        jq \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    \
    && curl -L -s -o /usr/bin/ha \
        "https://github.com/home-assistant/cli/releases/download/${HA_CLI_VERSION}/ha_${BUILD_ARCH}" \
    && chmod a+x /usr/bin/ha \
    \
    && rm -f -r /etc/nginx

# Install shell enhancements (starship, zoxide, eza, fastfetch)
ARG EZA_VERSION="0.20.14"
ARG FASTFETCH_VERSION="2.31.0"
RUN \
    curl -fsSL https://starship.rs/install.sh | sh -s -- --yes \
    && curl -fsSL https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | sh \
    && case "${BUILD_ARCH}" in \
        "amd64") EZA_ARCH="x86_64-unknown-linux-gnu" ;; \
        "aarch64") EZA_ARCH="aarch64-unknown-linux-gnu" ;; \
        "armv7") EZA_ARCH="armv7-unknown-linux-gnueabihf" ;; \
        "armhf") EZA_ARCH="armv7-unknown-linux-gnueabihf" ;; \
        *) echo "Unsupported architecture: ${BUILD_ARCH}" && exit 1 ;; \
    esac \
    && curl -fsSL "https://github.com/eza-community/eza/releases/download/v${EZA_VERSION}/eza_${EZA_ARCH}.tar.gz" \
        | tar -xz -C /usr/local/bin \
    && chmod +x /usr/local/bin/eza \
    \
    && case "${BUILD_ARCH}" in \
        "amd64") FASTFETCH_ARCH="linux-amd64" ;; \
        "aarch64") FASTFETCH_ARCH="linux-aarch64" ;; \
        "armv7") FASTFETCH_ARCH="linux-armv7l" ;; \
        "armhf") FASTFETCH_ARCH="linux-armv7l" ;; \
        *) echo "Unsupported architecture for fastfetch: ${BUILD_ARCH}" && exit 1 ;; \
    esac \
    && curl -fsSL "https://github.com/fastfetch-cli/fastfetch/releases/download/${FASTFETCH_VERSION}/fastfetch-${FASTFETCH_ARCH}.tar.gz" \
        | tar -xz -C /tmp \
    && cp /tmp/fastfetch-${FASTFETCH_ARCH}/usr/bin/fastfetch /usr/local/bin/ \
    && chmod +x /usr/local/bin/fastfetch \
    && rm -rf /tmp/fastfetch-${FASTFETCH_ARCH}

# Copy root file system
COPY rootfs /

# Build frontend with Vite
COPY frontend /tmp/frontend
RUN \
    cd /tmp/frontend \
    && npm install \
    && BUILD_OUT_DIR=/opt/ghostty/public npm run build \
    && rm -rf /tmp/frontend

# Install backend Node.js dependencies
RUN \
    cd /opt/ghostty \
    && npm install --production \
    && npm cache clean --force

# Build arguments
ARG BUILD_ARCH
ARG BUILD_DATE
ARG BUILD_DESCRIPTION
ARG BUILD_NAME
ARG BUILD_REF
ARG BUILD_REPOSITORY
ARG BUILD_VERSION

# Labels
LABEL \
    io.hass.name="${BUILD_NAME}" \
    io.hass.description="${BUILD_DESCRIPTION}" \
    io.hass.arch="${BUILD_ARCH}" \
    io.hass.type="addon" \
    io.hass.version=${BUILD_VERSION} \
    maintainer="Dale Higgs <@dale3h>" \
    org.opencontainers.image.title="${BUILD_NAME}" \
    org.opencontainers.image.description="${BUILD_DESCRIPTION}" \
    org.opencontainers.image.vendor="Home Assistant Community Apps" \
    org.opencontainers.image.authors="Dale Higgs <@dale3h>" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.url="https://apps.community" \
    org.opencontainers.image.source="https://github.com/${BUILD_REPOSITORY}" \
    org.opencontainers.image.documentation="https://github.com/${BUILD_REPOSITORY}/blob/main/README.md" \
    org.opencontainers.image.created=${BUILD_DATE} \
    org.opencontainers.image.revision=${BUILD_REF} \
    org.opencontainers.image.version=${BUILD_VERSION}
