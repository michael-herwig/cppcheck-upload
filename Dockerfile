# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: (c) 2022, Michael Herwig <contact@michael-herwig.de>

FROM node:alpine3.15

ADD ./ /opt/cppcheck-upload

WORKDIR /opt/cppcheck-upload
RUN npm install \
  && chmod +x entrypoint.sh

ENTRYPOINT [ "/opt/cppcheck-upload/entrypoint.sh" ]
