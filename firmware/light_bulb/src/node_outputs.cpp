/* 판단 결과를 릴레이·LED·Matter 엔드포인트로 내보낸다.
 * EP1 선풍기(On/Off, 기존 전구) · EP2 벽 표면 습도 · EP3 실내 습도 · EP4 벽 표면 온도 · EP5 가습기(On/Off)
 */
#include "node_outputs.h"
#include "decision.h"

#include "app/task_executor.h"
#include "board/board.h"

#include <app-common/zap-generated/attributes/Accessors.h>
#include <platform/CHIPDeviceLayer.h>

#include <zephyr/drivers/gpio.h>
#include <zephyr/kernel.h>

#include <math.h>

using namespace chip::app::Clusters;

namespace
{
const gpio_dt_spec sFanRelay = GPIO_DT_SPEC_GET(DT_ALIAS(relay_fan), gpios);
const gpio_dt_spec sHumidRelay = GPIO_DT_SPEC_GET(DT_ALIAS(relay_humid), gpios);
bool sHumid, sFan, sRisk;

uint16_t ToMatterRh(float rh)
{
	return rh <= 0.0f ? 0 : rh >= 100.0f ? 10000 : static_cast<uint16_t>(lroundf(rh * 100.0f));
}

void PushOutputsWork(intptr_t)
{
	OnOff::Attributes::OnOff::Set(kFanEndpointId, sFan);
	OnOff::Attributes::OnOff::Set(kHumidifierEndpointId, sHumid);
}

void PushSensorsWork(intptr_t)
{
	const node_status *s = decision_status();
	RelativeHumidityMeasurement::Attributes::MeasuredValue::Set(kSurfaceRhEndpointId, ToMatterRh(s->srh));
	RelativeHumidityMeasurement::Attributes::MeasuredValue::Set(kRoomRhEndpointId, ToMatterRh(g_in.room_rh));
	TemperatureMeasurement::Attributes::MeasuredValue::Set(kWallTempEndpointId,
							      static_cast<int16_t>(lroundf(g_in.wall_t * 100.0f)));
}
} /* namespace */

void NodeOutputsInit()
{
	gpio_pin_configure_dt(&sFanRelay, GPIO_OUTPUT_INACTIVE);
	gpio_pin_configure_dt(&sHumidRelay, GPIO_OUTPUT_INACTIVE);
	decision_start();
}

void NodeOnOffChanged(chip::EndpointId endpoint, bool on)
{
	NodeRelaySet(endpoint, on);

	/* 판단부가 내린 값과 다르면 앱(또는 DK 버튼)에서 바꾼 것. 부팅 직후 상태 복원은 무시한다 */
	bool *commanded = endpoint == kFanEndpointId ? &sFan : endpoint == kHumidifierEndpointId ? &sHumid : nullptr;
	if (commanded && *commanded != on && k_uptime_get() > 5000) {
		*commanded = on;
		decision_manual(sHumid, sFan);
	}
}

void NodeRelaySet(chip::EndpointId endpoint, bool on)
{
	if (endpoint == kFanEndpointId) {
		gpio_pin_set_dt(&sFanRelay, on);
	} else if (endpoint == kHumidifierEndpointId) {
		gpio_pin_set_dt(&sHumidRelay, on);
		Nrf::PostTask([on] { Nrf::GetBoard().GetLED(Nrf::DeviceLeds::LED3).Set(on); });
	}
}

extern "C" void outputs_apply(bool humid, bool fan)
{
	sHumid = humid;
	sFan = fan;
	chip::DeviceLayer::PlatformMgr().ScheduleWork(PushOutputsWork);
}

extern "C" void inputs_changed(void)
{
	static int64_t last;
	bool risk = decision_status()->srh >= 80.0f;
	if (risk != sRisk) {
		sRisk = risk;
		Nrf::PostTask([risk] { Nrf::GetBoard().GetLED(Nrf::DeviceLeds::LED4).Set(risk); });
	}
	if (k_uptime_get() - last < 1000) {
		return;
	}
	last = k_uptime_get();
	chip::DeviceLayer::PlatformMgr().ScheduleWork(PushSensorsWork);
}
