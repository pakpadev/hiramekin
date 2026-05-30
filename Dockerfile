FROM node:20-bookworm

ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PLAYWRIGHT_BROWSERS_PATH=/usr/bin
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PATH="${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator"
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    build-essential \
    ca-certificates \
    chromium \
    curl \
    fontconfig \
    fonts-noto-cjk \
    git \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libssl-dev \
    libwebkit2gtk-4.1-dev \
    openjdk-17-jdk \
    patchelf \
    pkg-config \
    unzip \
  && rm -rf /var/lib/apt/lists/*

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
  | sh -s -- -y --default-toolchain stable

RUN mkdir -p "${ANDROID_HOME}/cmdline-tools" \
  && curl -fsSL https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -o /tmp/android-commandlinetools.zip \
  && unzip -q /tmp/android-commandlinetools.zip -d /tmp/android-commandlinetools \
  && mv /tmp/android-commandlinetools/cmdline-tools "${ANDROID_HOME}/cmdline-tools/latest" \
  && rm -rf /tmp/android-commandlinetools /tmp/android-commandlinetools.zip \
  && yes | sdkmanager --licenses >/dev/null \
  && sdkmanager \
    "platform-tools" \
    "platforms;android-36" \
    "build-tools;36.0.0" \
    "ndk;27.1.12297006" \
    "cmake;3.22.1"

RUN sdkmanager "build-tools;35.0.0"

EXPOSE 19006 8081

CMD ["sh", "-lc", "if [ -f package.json ]; then npx expo start --web --host lan; else sleep infinity; fi"]
