package lat.yavaa.android.core.config

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class YavaaConfigTest {
    @Test
    fun `from trims valid urls and keys`() {
        val config = YavaaConfig.from(
            supabaseUrl = " https://project.supabase.co/ ",
            supabasePublishableKey = " sb_publishable_test ",
            backendBaseUrl = " https://api.yavaa.lat/ "
        )

        assertEquals("https://project.supabase.co", config.supabaseUrl)
        assertEquals("sb_publishable_test", config.supabasePublishableKey)
        assertEquals("https://api.yavaa.lat", config.backendBaseUrl)
    }

    @Test
    fun `from rejects blank values`() {
        val error = assertThrows(IllegalArgumentException::class.java) {
            YavaaConfig.from(
                supabaseUrl = "",
                supabasePublishableKey = "sb_publishable_test",
                backendBaseUrl = "https://api.yavaa.lat"
            )
        }

        assertEquals("Supabase URL is required", error.message)
    }
}

