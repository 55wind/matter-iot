#pragma once

#include <lib/core/DataModelTypes.h>

constexpr chip::EndpointId kFanEndpointId = 1;
constexpr chip::EndpointId kSurfaceRhEndpointId = 2;
constexpr chip::EndpointId kRoomRhEndpointId = 3;
constexpr chip::EndpointId kWallTempEndpointId = 4;
constexpr chip::EndpointId kHumidifierEndpointId = 5;

void NodeOutputsInit();
void NodeRelaySet(chip::EndpointId endpoint, bool on);
