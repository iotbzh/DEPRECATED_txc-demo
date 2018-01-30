###########################################################################
# Copyright 2016 IoT.bzh
#
# author: José Bollo <jose.bollo@iot.bzh>
# author: Stéphane Desneux <stephane.desneux@iot.bzh>
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
###########################################################################

cmake_minimum_required(VERSION 3.5)

include(${CMAKE_CURRENT_SOURCE_DIR}/conf.d/cmake/config.cmake)

file(GLOB_RECURSE HTML5FILES app/*)

add_custom_command(
	OUTPUT ${PROJECT_NAME}.wgt
	DEPENDS txc-binding stat-binding config.xml.in ${HTML5FILES} bower.json gulpfile.js package.json
	COMMAND yarn install
	COMMAND rm -rf package
	COMMAND mkdir -p package/${PROJECT_LIBDIR}
	COMMAND cd ${CMAKE_CURRENT_SOURCE_DIR} && gulp widget-config-prod && cp -a dist.prod ${CMAKE_CURRENT_BINARY_DIR}/package/htdocs
	COMMAND cp ${CMAKE_CURRENT_SOURCE_DIR}/${PROJECT_ICON} package/icon.png
	COMMAND mv package/htdocs/config.xml package/
	COMMAND cp -a ${CMAKE_CURRENT_SOURCE_DIR}/data package/
	COMMAND cp *.so package/${PROJECT_LIBDIR}
	COMMAND wgtpkg-pack -f -o ${PROJECT_NAME}.wgt package
)

add_custom_command(
	OUTPUT ${PROJECT_NAME}-devel.wgt
	DEPENDS txc-binding stat-binding config.xml.in ${HTML5FILES} bower.json gulpfile.js package.json
	COMMAND yarn install
	COMMAND rm -rf package
	COMMAND mkdir -p package/${PROJECT_LIBDIR}
	COMMAND cd ${CMAKE_CURRENT_SOURCE_DIR} && gulp widget-config-dev && cp -a dist.dev ${CMAKE_CURRENT_BINARY_DIR}/package/htdocs
	COMMAND cp ${CMAKE_CURRENT_SOURCE_DIR}/${PROJECT_ICON} package/icon.png
	COMMAND mv package/htdocs/config.xml package/
	COMMAND cp -a ${CMAKE_CURRENT_SOURCE_DIR}/data package/
	COMMAND cp *.so package/${PROJECT_LIBDIR}
	COMMAND wgtpkg-pack -f -o ${PROJECT_NAME}-devel.wgt package
)

add_custom_target(widget ALL DEPENDS ${PROJECT_NAME}.wgt ${PROJECT_NAME}-devel.wgt)
