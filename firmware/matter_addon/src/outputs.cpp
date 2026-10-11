#include <zephyr/drivers/gpio.h>
#include <app-common/zap-generated/attributes/Accessors.h>
#include <platform/CHIPDeviceLayer.h>
#include "decision.h"

using namespace chip::app::Clusters;

static const struct gpio_dt_spec humid_led = GPIO_DT_SPEC_GET(DT_ALIAS(led1), gpios);
static const struct gpio_dt_spec fan_relay = GPIO_DT_SPEC_GET(DT_ALIAS(relay_fan), gpios);
static bool s_fan;

void outputs_init()
{
    gpio_pin_configure_dt(&humid_led, GPIO_OUTPUT_INACTIVE);
    gpio_pin_configure_dt(&fan_relay, GPIO_OUTPUT_INACTIVE);
    decision_start();
}

void fan_relay_set(bool on) { gpio_pin_set_dt(&fan_relay, on); }

static void SetFanWork(intptr_t) { OnOff::Attributes::OnOff::Set(1, s_fan); }

extern "C" void outputs_apply(bool humid, bool fan)
{
    gpio_pin_set_dt(&humid_led, humid);      /* LED1 = 가습기 */
    s_fan = fan;                             /* 앱의 전구 = 선풍기 */
    chip::DeviceLayer::PlatformMgr().ScheduleWork(SetFanWork);
}

extern "C" void inputs_changed(void) {}
