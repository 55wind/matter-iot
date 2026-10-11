#include <zephyr/kernel.h>
#include <zephyr/drivers/gpio.h>
#include "decision.h"

static const struct gpio_dt_spec humid_led = GPIO_DT_SPEC_GET(DT_ALIAS(led1), gpios);
static const struct gpio_dt_spec fan_led   = GPIO_DT_SPEC_GET(DT_ALIAS(led2), gpios);
static const struct gpio_dt_spec fan_relay = GPIO_DT_SPEC_GET(DT_ALIAS(relay_fan), gpios);

void outputs_apply(bool h, bool f)
{
    gpio_pin_set_dt(&humid_led, h);   /* LED1 = 가습기 */
    gpio_pin_set_dt(&fan_led, f);     /* LED2 = 선풍기 */
    gpio_pin_set_dt(&fan_relay, f);   /* 딸깍 */
}
void inputs_changed(void) {}

int main(void)
{
    gpio_pin_configure_dt(&humid_led, GPIO_OUTPUT_INACTIVE);
    gpio_pin_configure_dt(&fan_led, GPIO_OUTPUT_INACTIVE);
    gpio_pin_configure_dt(&fan_relay, GPIO_OUTPUT_INACTIVE);
    decision_start();
    return 0;
}
