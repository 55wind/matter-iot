#pragma once

#include <lib/core/DataModelTypes.h>

constexpr chip::EndpointId kFanEndpointId = 1;
constexpr chip::EndpointId kSurfaceRhEndpointId = 2;
constexpr chip::EndpointId kRoomRhEndpointId = 3;
constexpr chip::EndpointId kWallTempEndpointId = 4;
constexpr chip::EndpointId kHumidifierEndpointId = 5;

void NodeOutputsInit();
void NodeRelaySet(chip::EndpointId endpoint, bool on);
/* On/Off 속성이 바뀔 때마다 호출: 릴레이를 움직이고, 앱에서 바꾼 것이면 판단부에 알린다 */
void NodeOnOffChanged(chip::EndpointId endpoint, bool on);
