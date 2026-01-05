<script setup lang="ts">
definePageMeta({
  middleware: [
    function () {
      return navigateTo('/tiers/policy')
    }
  ]
})
</script>
