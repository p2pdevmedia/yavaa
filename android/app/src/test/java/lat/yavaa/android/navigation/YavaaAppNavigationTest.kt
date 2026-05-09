package lat.yavaa.android.navigation

import org.junit.Assert.assertEquals
import org.junit.Test

class YavaaAppNavigationTest {
    @Test
    fun `account action label prompts login when unauthenticated`() {
        assertEquals("Ingresar", accountActionLabel(authenticated = false))
    }

    @Test
    fun `account action label points to account when authenticated`() {
        assertEquals("Tu cuenta", accountActionLabel(authenticated = true))
    }
}
